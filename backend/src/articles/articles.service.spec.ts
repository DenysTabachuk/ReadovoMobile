import { BadGatewayException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ArticleFormulaRenderer } from './discovery/article-formula-renderer';
import { WikipediaArticlesService } from './discovery/wikipedia-articles.service';
import { AiRateLimitCoordinator } from './infrastructure/ai-rate-limit.coordinator';
import { AiStructuredOutputRunner } from './infrastructure/ai-structured-output.runner';
import { AiTelemetry } from './infrastructure/ai.telemetry';
import { AiTokenCounter } from './infrastructure/ai-token-counter';
import { GroqTextClient } from './infrastructure/groq-text.client';
import { ArticleLibraryService } from './library/article-library.service';
import { ArticleQuizService } from './quiz/article-quiz.service';
import { ArticleQuizPromptPlanner } from './quiz/article-quiz-prompt.planner';
import { ArticleQuizValidator } from './quiz/article-quiz.validator';
import { ArticleVocabularyQuizValidator } from './quiz/article-vocabulary-quiz.validator';
import { ArticleAdaptationService } from './transformation/article-adaptation.service';
import { ArticleContentProcessor } from './transformation/article-content.processor';
import { ArticlePromptFactory } from './transformation/article-prompt.factory';
import { ArticleSimplificationCache } from './transformation/article-simplification-cache';
import { ArticleTransformationChunkCache } from './transformation/article-transformation-chunk-cache';
import { ArticleTransformationPlanner } from './transformation/article-transformation.planner';
import { ArticleTransformationValidator } from './transformation/article-transformation.validator';
import { ArticlesService } from './articles.service';

type GroqChatCompletionRequest = {
  messages: Array<{ content?: string }>;
};

const createChatCompletionMock = jest.fn<
  Promise<unknown>,
  [request: GroqChatCompletionRequest]
>();

function getGroqPrompt(callIndex = 0): string {
  const calls = createChatCompletionMock.mock.calls as Array<
    [GroqChatCompletionRequest]
  >;
  const request = calls[callIndex]?.[0];

  return String(request?.messages[1]?.content ?? '');
}

function createStrictReadingQuestion() {
  return {
    correctOptionIds: ['true'],
    id: 'summary-q-1',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    prompt: 'The Solar System includes the Sun.',
    type: 'true_false' as const,
  };
}

function serializeStrictAiOutput(output: Record<string, unknown>): string {
  const questions = Array.isArray(output.questions)
    ? output.questions.map((question) => {
        const value = question as Record<string, unknown>;
        return {
          ...value,
          explanation: value.explanation ?? null,
          ...('term' in value
            ? { sourceExcerpt: value.sourceExcerpt ?? null }
            : {}),
        };
      })
    : null;
  const adaptedBlocks = Array.isArray(output.adaptedBlocks)
    ? output.adaptedBlocks.map((block) => serializeStrictBlock(block))
    : undefined;

  return JSON.stringify({
    ...output,
    ...(adaptedBlocks ? { adaptedBlocks } : {}),
    questions,
  });
}

function serializeStrictBlock(block: unknown): unknown {
  if (!block || typeof block !== 'object') return block;

  const value = block as Record<string, unknown>;
  if (value.type === 'paragraph') {
    return {
      ...value,
      children: Array.isArray(value.children)
        ? value.children.map(serializeStrictInlineNode)
        : value.children,
    };
  }
  if (value.type === 'list') {
    return {
      ...value,
      items: Array.isArray(value.items)
        ? value.items.map((item: unknown) =>
            Array.isArray(item) ? item.map(serializeStrictInlineNode) : item,
          )
        : value.items,
    };
  }
  if (value.type === 'table') {
    return {
      ...value,
      rows: Array.isArray(value.rows)
        ? value.rows.map((row: unknown) =>
            Array.isArray(row)
              ? row.map((cell: unknown) => {
                  const cellValue = cell as Record<string, unknown>;
                  return { ...cellValue, header: cellValue.header ?? null };
                })
              : row,
          )
        : value.rows,
    };
  }
  if (value.type === 'image') {
    return {
      ...value,
      alt: value.alt ?? null,
      caption: value.caption ?? null,
    };
  }

  return value;
}

function serializeStrictInlineNode(node: unknown): unknown {
  const value = node as Record<string, unknown>;
  return {
    ...value,
    bold: value.bold ?? false,
    italic: value.italic ?? false,
  };
}

jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (request: GroqChatCompletionRequest) => ({
          withResponse: async () => ({
            data: await createChatCompletionMock(request),
            response: new Response(null, {
              headers: {
                'x-ratelimit-limit-tokens': '8000',
                'x-ratelimit-remaining-tokens': '7000',
                'x-ratelimit-reset-tokens': '1s',
              },
            }),
          }),
        }),
      },
    },
  })),
}));

describe('ArticlesService', () => {
  let service: ArticlesService;
  let formulaRenderer: ArticleFormulaRenderer;
  let fetchMock: jest.Mock;
  let queryMock: jest.Mock;
  let tokenCounter: AiTokenCounter;

  beforeEach(() => {
    fetchMock = jest.fn();
    queryMock = jest.fn();
    queryMock.mockResolvedValue(null);
    global.fetch = fetchMock as typeof fetch;
    createChatCompletionMock.mockReset();
    process.env.GROQ_API_KEY = 'test-key';

    const prisma = {
      articleSimplification: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: queryMock,
        upsert: queryMock,
      },
      articleTransformationChunk: {
        delete: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      user: { findUnique: jest.fn() },
      userRecentArticle: {},
      userSavedArticle: {},
    } as unknown as PrismaService;
    formulaRenderer = new ArticleFormulaRenderer();
    const contentProcessor = new ArticleContentProcessor();
    const quizValidator = new ArticleQuizValidator();
    const vocabularyValidator = new ArticleVocabularyQuizValidator(
      quizValidator,
    );
    const aiTelemetry = new AiTelemetry();
    tokenCounter = new AiTokenCounter();
    const rateLimits = new AiRateLimitCoordinator();
    const groqTextClient = new GroqTextClient(
      aiTelemetry,
      rateLimits,
      tokenCounter,
    );
    const outputRunner = new AiStructuredOutputRunner(
      groqTextClient,
      aiTelemetry,
    );
    const promptFactory = new ArticlePromptFactory(contentProcessor);
    const quizPromptPlanner = new ArticleQuizPromptPlanner(
      contentProcessor,
      rateLimits,
      tokenCounter,
    );
    const transformationValidator = new ArticleTransformationValidator(
      quizValidator,
    );
    const adaptationService = new ArticleAdaptationService(
      contentProcessor,
      outputRunner,
      promptFactory,
      quizPromptPlanner,
      quizValidator,
      new ArticleSimplificationCache(prisma, contentProcessor),
      new ArticleTransformationChunkCache(prisma),
      new ArticleTransformationPlanner(
        contentProcessor,
        promptFactory,
        rateLimits,
        tokenCounter,
      ),
      transformationValidator,
    );
    service = new ArticlesService(
      adaptationService,
      new ArticleLibraryService(prisma),
      new ArticleQuizService(
        outputRunner,
        promptFactory,
        quizPromptPlanner,
        quizValidator,
        vocabularyValidator,
      ),
      new WikipediaArticlesService(formulaRenderer),
    );
  });

  afterEach(() => {
    tokenCounter.onModuleDestroy();
    delete process.env.GROQ_API_KEY;
  });

  it('maps random Wikipedia pages into article previews', async () => {
    fetchMock.mockResolvedValue({
      json: () =>
        Promise.resolve({
          query: {
            pages: {
              '1': {
                extract:
                  'Article preview with enough detail for reading practice and a useful lesson preview about a broad topic with real context.',
                fullurl: 'https://en.wikipedia.org/wiki/Example',
                length: 6200,
                pageid: 1,
                thumbnail: {
                  source: 'https://upload.wikimedia.org/example.jpg',
                },
                title: 'Example',
              },
            },
          },
        }),
      ok: true,
    });

    const articles = await service.getRandomArticles(3);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://en.wikipedia.org/w/api.php?'),
      expect.any(Object),
    );
    const [, requestOptions] = (fetchMock.mock.calls[0] ?? []) as [
      string,
      Record<string, unknown>,
    ];

    expect(requestOptions).toMatchObject({
      headers: {
        'Api-User-Agent': 'Readovo/1.0',
      },
    });
    expect(articles).toEqual([
      {
        extract:
          'Article preview with enough detail for reading practice and a useful lesson preview about a broad topic with real context.',
        id: 1,
        pageLength: 6200,
        thumbnailUrl: 'https://upload.wikimedia.org/example.jpg',
        title: 'Example',
        url: 'https://en.wikipedia.org/wiki/Example',
      },
    ]);
  });

  it('sanitizes wikipedia preview math artifacts', async () => {
    fetchMock.mockResolvedValue({
      json: () =>
        Promise.resolve({
          query: {
            pages: {
              '1': {
                extract:
                  'A function of a real variable (usually {\\displaystyle t}) can be mapped to {\\displaystyle s}, which makes the topic useful for a longer learning article.',
                fullurl: 'https://en.wikipedia.org/wiki/Laplace_transform',
                length: 9000,
                pageid: 1,
                thumbnail: {
                  source: 'https://upload.wikimedia.org/laplace.jpg',
                },
                title: 'Laplace transform',
              },
            },
          },
        }),
      ok: true,
    });

    const articles = await service.getRandomArticles(1);

    expect(articles).toEqual([
      {
        extract:
          'A function of a real variable (usually t) can be mapped to s, which makes the topic useful for a longer learning article.',
        id: 1,
        pageLength: 9000,
        thumbnailUrl: 'https://upload.wikimedia.org/laplace.jpg',
        title: 'Laplace transform',
        url: 'https://en.wikipedia.org/wiki/Laplace_transform',
      },
    ]);
  });

  it('returns article detail text for a page id', async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                '42': {
                  fullurl: 'https://en.wikipedia.org/wiki/Answer',
                  pageid: 42,
                  title: 'Answer',
                },
              },
            },
          }),
        ok: true,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><body><section><p>Full article text.</p></section></body></html>',
          ),
      });

    const article = await service.getArticleDetail(42);

    expect(article).toEqual({
      blocks: [
        {
          children: [
            {
              text: 'Full',
              type: 'word',
            },
            {
              text: ' ',
              type: 'text',
            },
            {
              text: 'article',
              type: 'word',
            },
            {
              text: ' ',
              type: 'text',
            },
            {
              text: 'text',
              type: 'word',
            },
            {
              text: '.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      content: 'Full article text.',
      id: 42,
      thumbnailUrl: undefined,
      title: 'Answer',
      url: 'https://en.wikipedia.org/wiki/Answer',
    });
  });

  it('renders display formulas into SVG blocks for article detail', async () => {
    jest.spyOn(formulaRenderer, 'render').mockResolvedValue([
      {
        children: [
          { text: 'Before', type: 'word' },
          { text: '.', type: 'text' },
        ],
        type: 'paragraph',
      },
      {
        altText: 'x^2 + y^2 = z^2',
        display: true,
        heightEx: 2.464,
        latex: '{\\displaystyle x^{2}+y^{2}=z^{2}}',
        mathml: '<math alttext="{\\displaystyle x^{2}+y^{2}=z^{2}}"></math>',
        svg: '<svg viewBox="0 0 10 10"></svg>',
        type: 'formula',
        widthEx: 12.318,
      },
      {
        children: [
          { text: 'After', type: 'word' },
          { text: '.', type: 'text' },
        ],
        type: 'paragraph',
      },
    ]);

    fetchMock
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                '42': {
                  fullurl: 'https://en.wikipedia.org/wiki/Laplace_transform',
                  pageid: 42,
                  title: 'Laplace transform',
                },
              },
            },
          }),
        ok: true,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(`
            <html>
              <body>
                <section>
                  <p>Before.</p>
                  <div class="mwe-math-element" typeof="mw:Extension/math">
                    <math alttext="{\\displaystyle x^{2}+y^{2}=z^{2}}">
                      <semantics>
                        <mrow>
                          <msup><mi>x</mi><mn>2</mn></msup>
                          <mo>+</mo>
                          <msup><mi>y</mi><mn>2</mn></msup>
                          <mo>=</mo>
                          <msup><mi>z</mi><mn>2</mn></msup>
                        </mrow>
                        <annotation encoding="application/x-tex">
                          {\\displaystyle x^{2}+y^{2}=z^{2}}
                        </annotation>
                      </semantics>
                    </math>
                  </div>
                  <p>After.</p>
                </section>
              </body>
            </html>
          `),
      });

    const article = await service.getArticleDetail(42);
    const formulaBlock = article.blocks[1];

    expect(article.content).toBe('Before.\n\nx^2 + y^2 = z^2\n\nAfter.');
    expect(formulaBlock?.type).toBe('formula');
    expect(
      formulaBlock?.type === 'formula' ? formulaBlock.altText : undefined,
    ).toBe('x^2 + y^2 = z^2');
    expect(
      formulaBlock?.type === 'formula' ? formulaBlock.display : undefined,
    ).toBe(true);
    expect(
      formulaBlock?.type === 'formula' ? formulaBlock.heightEx : undefined,
    ).toEqual(expect.any(Number));
    expect(
      formulaBlock?.type === 'formula' ? formulaBlock.svg : undefined,
    ).toEqual(expect.stringContaining('<svg'));
    expect(
      formulaBlock?.type === 'formula' ? formulaBlock.widthEx : undefined,
    ).toEqual(expect.any(Number));
  });

  it('throws when Wikipedia returns an invalid article payload', async () => {
    fetchMock.mockResolvedValue({
      json: () =>
        Promise.resolve({
          query: {
            pages: {
              '42': {
                pageid: 42,
                title: 'Broken article',
              },
            },
          },
        }),
      ok: true,
    });

    await expect(service.getArticleDetail(42)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('returns a cached simplified article without calling Groq', async () => {
    queryMock.mockResolvedValueOnce({
      adaptedBlocks: null,
      adaptedLength: 32,
      adaptedText: 'Simple text about the Solar System.',
      articleId: null,
      cacheKey: 'cache-key',
      createdAt: new Date(),
      level: 'A2',
      originalLength: 120,
      questions: null,
      sourceHash: null,
      targetLength: 'short',
      targetPercent: null,
      title: 'Solar System',
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(createChatCompletionMock).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      adaptedBlocks: [
        {
          children: [
            {
              text: 'Simple text about the Solar System.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      adaptedLength: 32,
      level: 'A2',
      originalLength: 120,
      questions: undefined,
      title: 'Solar System',
      transformationType: 'summary',
    });
  });

  it('simplifies an article with Groq and stores the result', async () => {
    queryMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: serializeStrictAiOutput({
              adaptedBlocks: [
                {
                  children: [
                    {
                      text: 'The Solar System has the Sun and planets.',
                      type: 'text',
                    },
                  ],
                  type: 'paragraph',
                },
              ],
              questions: [createStrictReadingQuestion()],
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(createChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        max_completion_tokens: 2500,
        model: 'openai/gpt-oss-120b',
      }),
    );
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(response).toEqual({
      adaptedBlocks: [
        {
          children: [
            {
              text: 'The Solar System has the Sun and planets.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      adaptedLength: 41,
      level: 'A2',
      originalLength: 17,
      questions: [
        {
          correctOptionIds: ['true'],
          id: 'summary-q-1',
          options: [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' },
          ],
          prompt: 'The Solar System includes the Sun.',
          type: 'true_false',
        },
      ],
      title: 'Solar System',
      transformationType: 'summary',
    });
  });

  it('keeps original length when target percent is 100', async () => {
    queryMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: serializeStrictAiOutput({
              adaptedBlocks: [
                {
                  children: [
                    {
                      text: 'The Solar System has the Sun and planets.',
                      type: 'text',
                    },
                  ],
                  type: 'paragraph',
                },
              ],
              questions: [createStrictReadingQuestion()],
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      text: 'Long article text',
      title: 'Solar System',
    });
    const prompt = getGroqPrompt();

    expect(prompt).toContain('Summarize and shorten the article');
    expect(prompt).toContain('Hard maximum');
    expect(response.transformationType).toBe('summary');
  });

  it('parses structured simplification response with blocks and questions', async () => {
    queryMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: serializeStrictAiOutput({
              adaptedBlocks: [
                {
                  level: 1,
                  text: 'Solar System',
                  type: 'heading',
                },
                {
                  children: [{ text: 'The Sun is a star.', type: 'text' }],
                  type: 'paragraph',
                },
              ],
              questions: [
                {
                  correctOptionIds: ['a'],
                  id: 'q-1',
                  options: [
                    { id: 'a', text: 'True' },
                    { id: 'b', text: 'False' },
                  ],
                  prompt: 'The Sun is a star.',
                  type: 'true_false',
                },
              ],
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(response.adaptedBlocks).toHaveLength(2);
    expect(response.questions).toEqual([
      {
        correctOptionIds: ['a'],
        id: 'q-1',
        options: [
          { id: 'a', text: 'True' },
          { id: 'b', text: 'False' },
        ],
        prompt: 'The Sun is a star.',
        type: 'true_false',
      },
    ]);
  });

  it('fails closed when Groq violates the strict transformation contract', async () => {
    queryMock.mockResolvedValueOnce(null);
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              'Architecture is the art and practice of designing buildings.\n\nIt also includes planning spaces for people to use.',
          },
        },
      ],
    });

    await expect(
      service.simplifyArticle({
        level: 'A2',
        text: 'Long article text',
        title: 'Architecture',
        transformationType: 'adaptation',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it('retries one semantic transformation violation and then fails closed', async () => {
    queryMock.mockResolvedValueOnce(null);
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: serializeStrictAiOutput({
              adaptedBlocks: [
                {
                  src: 'https://example.com/invented-image.jpg',
                  type: 'image',
                },
              ],
            }),
          },
        },
      ],
    });

    await expect(
      service.simplifyArticle({
        level: 'A2',
        text: 'Long article text',
        title: 'Architecture',
        transformationType: 'adaptation',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);

    expect(createChatCompletionMock).toHaveBeenCalledTimes(2);
    expect(getGroqPrompt(1)).toContain('image src must exactly match');
  });

  it('prepares only the requested percent variant for persisted article adaptations', async () => {
    createChatCompletionMock.mockImplementation(
      (request: { messages: Array<{ content?: string }> }) => {
        const prompt = String(request.messages[1]?.content ?? '');
        const percentMatch = prompt.match(/about (\d+)%/);
        const percent = percentMatch?.[1] ?? '25';

        return Promise.resolve({
          choices: [
            {
              message: {
                content: serializeStrictAiOutput({
                  adaptedBlocks: [
                    {
                      children: [
                        {
                          text: `Solar System summary ${percent}%.`,
                          type: 'text',
                        },
                      ],
                      type: 'paragraph',
                    },
                  ],
                  questions: [createStrictReadingQuestion()],
                }),
              },
            },
          ],
        });
      },
    );

    const response = await service.simplifyArticle({
      articleId: 42,
      level: 'A2',
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(response.adaptedBlocks[0]).toEqual({
      children: [{ text: 'Solar System summary 25%.', type: 'text' }],
      type: 'paragraph',
    });
  });

  it('simplifies long structured articles in chunks and preserves selected media blocks', async () => {
    const firstParagraph =
      `${'The Sun gives Earth light and heat. '.repeat(250)}`.trim();
    const secondParagraph =
      `${'Planets move around the Sun in space. '.repeat(250)}`.trim();
    const text = `${firstParagraph}\n\n${secondParagraph}`;

    createChatCompletionMock
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: serializeStrictAiOutput({
                adaptedBlocks: [
                  {
                    children: [
                      { text: 'The Sun gives Earth light.', type: 'text' },
                    ],
                    type: 'paragraph',
                  },
                  {
                    alt: 'The Sun',
                    caption: 'The Sun',
                    src: 'https://upload.wikimedia.org/sun.jpg',
                    type: 'image',
                  },
                ],
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: serializeStrictAiOutput({
                adaptedBlocks: [
                  {
                    children: [
                      { text: 'Planets move around the Sun.', type: 'text' },
                    ],
                    type: 'paragraph',
                  },
                  {
                    rows: [
                      [
                        { header: true, text: 'Planet' },
                        { header: true, text: 'Type' },
                      ],
                      [{ text: 'Earth' }, { text: 'Rocky' }],
                    ],
                    type: 'table',
                  },
                ],
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: serializeStrictAiOutput({
                questions: [
                  {
                    correctOptionIds: ['a'],
                    id: 'q-1',
                    options: [
                      { id: 'a', text: 'True' },
                      { id: 'b', text: 'False' },
                    ],
                    prompt: 'The Sun gives Earth light.',
                    type: 'true_false',
                  },
                ],
              }),
            },
          },
        ],
      });

    const response = await service.simplifyArticle({
      blocks: [
        {
          children: [{ text: firstParagraph, type: 'text' }],
          type: 'paragraph',
        },
        {
          alt: 'The Sun',
          caption: 'The Sun',
          src: 'https://upload.wikimedia.org/sun.jpg',
          type: 'image',
        },
        {
          children: [{ text: secondParagraph, type: 'text' }],
          type: 'paragraph',
        },
        {
          rows: [
            [
              { header: true, text: 'Planet' },
              { header: true, text: 'Type' },
            ],
            [{ text: 'Earth' }, { text: 'Rocky' }],
          ],
          type: 'table',
        },
      ],
      level: 'A2',
      text,
      title: 'Solar System',
    });

    expect(createChatCompletionMock).toHaveBeenCalledTimes(3);
    expect(response.adaptedBlocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: 'https://upload.wikimedia.org/sun.jpg',
          type: 'image',
        }),
        expect.objectContaining({
          type: 'table',
        }),
      ]),
    );
    expect(response.questions).toHaveLength(1);
  });

  it('generates a reading quiz from token-safe excerpts of a large article', async () => {
    const paragraphs = Array.from({ length: 80 }, (_, index) =>
      `Section ${index + 1}. ${'Computers process information and follow instructions. '.repeat(18)}`.trim(),
    );
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: serializeStrictAiOutput({
              questions: [createStrictReadingQuestion()],
            }),
          },
        },
      ],
    });

    const questions = await service.generateArticleQuiz({
      level: 'A2',
      targetLength: 'short',
      text: paragraphs.join('\n\n'),
      title: 'Computer',
    });
    const prompt = getGroqPrompt();

    expect(questions).toHaveLength(1);
    expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(prompt).toContain('Representative excerpts:');
    expect(prompt).toContain('Section 1.');
    expect(prompt).toContain('Section 80.');
  });

  it('generates a structured vocabulary quiz from article text', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: serializeStrictAiOutput({
              questions: [
                {
                  correctOptionIds: ['a'],
                  format: 'translation',
                  id: 'vq-1',
                  options: [
                    { id: 'a', text: 'eruption' },
                    { id: 'b', text: 'wind' },
                    { id: 'c', text: 'river' },
                    { id: 'd', text: 'mountain' },
                  ],
                  prompt:
                    'Choose the best Ukrainian translation of "eruption".',
                  sourceExcerpt:
                    'Scientists study volcanoes. Lava flows down the mountain during an eruption.',
                  term: 'eruption',
                  termKind: 'word',
                  translation: 'виверження',
                  type: 'single_choice',
                },
                {
                  correctOptionIds: ['a'],
                  format: 'translation',
                  id: 'vq-2',
                  options: [
                    { id: 'a', text: 'лава' },
                    { id: 'b', text: 'хмара' },
                    { id: 'c', text: 'трава' },
                    { id: 'd', text: 'море' },
                  ],
                  prompt: 'Choose the best Ukrainian translation of "lava".',
                  sourceExcerpt:
                    'Lava flows down the mountain during an eruption.',
                  term: 'lava',
                  termKind: 'word',
                  translation: 'лава',
                  type: 'single_choice',
                },
                {
                  correctOptionIds: ['a'],
                  format: 'translation',
                  id: 'vq-3',
                  options: [
                    { id: 'a', text: 'гора' },
                    { id: 'b', text: 'долина' },
                    { id: 'c', text: 'річка' },
                    { id: 'd', text: 'стежка' },
                  ],
                  prompt:
                    'Choose the best Ukrainian translation of "mountain".',
                  sourceExcerpt:
                    'Lava flows down the mountain during an eruption.',
                  term: 'mountain',
                  termKind: 'word',
                  translation: 'гора',
                  type: 'single_choice',
                },
              ],
              resolvedLevel: 'B1',
            }),
          },
        },
      ],
    });

    const response = await service.generateArticleVocabularyQuiz({
      text: 'Scientists study volcanoes. Lava flows down the mountain during an eruption.',
      title: 'Volcanoes',
    });
    const prompt = getGroqPrompt();

    expect(prompt).toContain(
      'Question 1 must use "translation", question 2 "reverse_translation", question 3 "cloze"',
    );
    expect(response.resolvedLevel).toBe('B1');
    expect(response.questions).toHaveLength(3);
    expect(response.questions[0]).toMatchObject({
      correctOptionIds: ['vq-1:correct'],
      format: 'translation',
      id: 'vq-1',
      sourceExcerpt:
        'Scientists study volcanoes. Lava flows down the mountain during an eruption.',
      term: 'eruption',
      termKind: 'word',
      type: 'single_choice',
    });
    expect(response.questions.map((question) => question.format)).toEqual([
      'translation',
      'reverse_translation',
      'cloze',
    ]);
    expect(response.questions[0]?.options).toHaveLength(4);
    expect(response.questions[0]?.prompt).toContain('eruption');
  });

  it('retries invalid vocabulary targets and accepts a corrected response', async () => {
    createChatCompletionMock
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: serializeStrictAiOutput({
                questions: [
                  {
                    correctOptionIds: ['a'],
                    format: 'translation',
                    id: 'vq-1',
                    options: [
                      { id: 'a', text: 'таємничий' },
                      { id: 'b', text: 'прозорий' },
                      { id: 'c', text: 'швидкий' },
                      { id: 'd', text: 'гарячий' },
                    ],
                    prompt:
                      'Choose the best Ukrainian translation of "mysterious".',
                    sourceExcerpt: 'The forest canopy protects many insects.',
                    term: 'mysterious',
                    termKind: 'word',
                    translation: 'таємничий',
                    type: 'single_choice',
                  },
                  {
                    correctOptionIds: ['a'],
                    format: 'translation',
                    id: 'vq-2',
                    options: [
                      { id: 'a', text: 'це' },
                      { id: 'b', text: 'вони' },
                      { id: 'c', text: 'вона' },
                      { id: 'd', text: 'він' },
                    ],
                    prompt: 'Choose the best Ukrainian translation of "the".',
                    sourceExcerpt: 'The forest canopy protects many insects.',
                    term: 'the',
                    termKind: 'word',
                    translation: 'це',
                    type: 'single_choice',
                  },
                  {
                    correctOptionIds: ['b'],
                    format: 'translation',
                    id: 'vq-3',
                    options: [
                      { id: 'a', text: 'лісова стежка' },
                      { id: 'b', text: 'лісовий полог' },
                      { id: 'c', text: 'гірський схил' },
                      { id: 'd', text: 'нічний вітер' },
                    ],
                    prompt:
                      'Choose the best Ukrainian translation of "forest canopy" as used in the text.',
                    sourceExcerpt: 'The forest canopy protects many insects.',
                    term: 'forest canopy',
                    termKind: 'phrase',
                    translation: 'полог',
                    type: 'single_choice',
                  },
                ],
                resolvedLevel: 'A2',
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: serializeStrictAiOutput({
                questions: [
                  {
                    correctOptionIds: ['b'],
                    format: 'translation',
                    id: 'vq-3',
                    options: [
                      { id: 'a', text: 'лісова стежка' },
                      { id: 'b', text: 'лісовий полог' },
                      { id: 'c', text: 'гірський схил' },
                      { id: 'd', text: 'нічний вітер' },
                    ],
                    prompt:
                      'Choose the best Ukrainian translation of "forest canopy" as used in the text.',
                    sourceExcerpt: 'The forest canopy protects many insects.',
                    term: 'forest canopy',
                    termKind: 'phrase',
                    translation: 'лісовий полог',
                    type: 'single_choice',
                  },
                ],
                resolvedLevel: 'A2',
              }),
            },
          },
        ],
      });

    const response = await service.generateArticleVocabularyQuiz({
      text: 'The forest canopy protects many insects.',
      title: 'Forests',
    });

    expect(response.questions).toHaveLength(1);
    expect(response.questions[0]).toMatchObject({
      correctOptionIds: ['vq-3:correct'],
      format: 'translation',
      id: 'vq-3',
      prompt: 'Оберіть український переклад: forest canopy',
      sourceExcerpt: 'The forest canopy protects many insects.',
      term: 'forest canopy',
      termKind: 'phrase',
      type: 'single_choice',
    });
    expect(response.questions[0]?.options).toHaveLength(4);
    expect(createChatCompletionMock).toHaveBeenCalledTimes(2);
    expect(getGroqPrompt(1)).toContain('missing from the source text');
  });

  it('preserves requested C1 level for vocabulary quiz generation', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: serializeStrictAiOutput({
              questions: [
                {
                  correctOptionIds: ['c'],
                  format: 'translation',
                  id: 'vq-1',
                  options: [
                    { id: 'a', text: 'відмова' },
                    { id: 'b', text: 'затримка' },
                    { id: 'c', text: 'uncertainty' },
                    { id: 'd', text: 'перемога' },
                  ],
                  prompt:
                    'Choose the best Ukrainian translation of "ambiguity".',
                  sourceExcerpt:
                    'The policy language created ambiguity for both investors and regulators.',
                  term: 'ambiguity',
                  termKind: 'word',
                  translation: 'неоднозначність',
                  type: 'single_choice',
                },
              ],
              resolvedLevel: 'B2',
            }),
          },
        },
      ],
    });

    const response = await service.generateArticleVocabularyQuiz({
      level: 'C1',
      text: 'The policy language created ambiguity for both investors and regulators.',
      title: 'Policy Language',
    });
    const prompt = getGroqPrompt();

    expect(prompt).toContain('Learner level is fixed at C1.');
    expect(prompt).toContain('Set "resolvedLevel" to "C1"');
    expect(response.resolvedLevel).toBe('C1');
  });

  it('rejects truncated vocabulary JSON instead of repairing it', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: `\`\`\`json
{
  "resolvedLevel": "A2",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "format": "translation",
      "term": "mathematician",
      "termKind": "word",
      "translation": "математик",
      "prompt": "A person who works with numbers is called",
      "sourceExcerpt": "Alan Turing was an English mathematician.",
      "options": [
        { "id": "o1", "text": "mathematician" },
        { "id": "o2", "text": "chemist" },
        { "id": "o3", "text": "pilot" },
        { "id": "o4", "text": "artist" }
      ],
      "correctOptionIds": ["o1"]
    },
    {
      "id": "q2",
      "type": "single_choice",
      "format": "reverse_translation",
      "term": "algorithm",
      "termKind": "word",
      "translation": "алгоритм",
      "prompt": "A set of steps for solving a problem is called",
      "sourceExcerpt": "The machine could follow an algorithm.",
      "options": [
        { "id": "o1", "text": "poem" },
        { "id": "o2", "text": "algorithm" },
        { "id": "o3", "text": "bridge" },
        { "id": "o4", "text": "painting" }
      ],
      "correctOptionIds": ["o2"]
    },
    {
      "id": "q3",
      "type": "single_choice",
      "format": "cloze",
      "term": "computer science",
      "termKind": "phrase",
      "translation": "комп'ютерні науки",
      "prompt": "The study of computers is called",
      "sourceExcerpt": "He helped develop theoretical computer science.",
      "options": [
        { "id": "o1", "text": "biology" },
        { "id": "o2", "text": "history" },
        { "id": "o3", "text": "computer science" },
        { "id": "o4", "text": "music" }
      ],
      "correctOptionIds": ["o3"]
    },
    {
      "id": "q4",
      "type": "single_choice",
      "format": "definition",
      "term": "artificial intelligence",
      "termKind": "phrase",
      "translation": "штучний інтелект",
      "prompt": "Machines that try to think like humans use",
      "sourceExcerpt": "Turing wrote about artificial intelligence.",
      "options": [
        { "id": "o1", "text": "robotics" },
        { "id": "o2", "text": "artificial intelligence" },
        { "id": "o3", "text": "geography" },
        { "id": "o4", "text": "chemistry" }
      ],
      "correctOptionIds": ["o2"]
    },
    {
      "id": "q5",
      "type": "single_choice",
      "format": "synonym",
      "term": "codebreaking",
      "termKind": "word",
      "translation": "зламування кодів",
      "prompt": "Finding the meaning of secret messages is called",
      "sourceExcerpt": "He worked at Britain's codebreaking centre.",
      "options": [
        { "id": "o1", "text": "gardening" },
        { "id": "o2", "text": "cooking" },
        { "id": "o3", "text": "codebreaking" },
        { "id": "o4", "text": "drawing" }
      ],
      "correctOptionIds": ["o3"]
    },
    {
      "id": "q6",
      "type": "single_choice",
      "format": "definition",
      "term": "chemical basis",
      "termKind": "phrase",
      "translation": "хімічна основа",
      "prompt": "The study of chemical processes is called`,
          },
        },
      ],
    });

    await expect(
      service.generateArticleVocabularyQuiz({
        level: 'A2',
        text: "Alan Turing was an English mathematician. The machine could follow an algorithm. He helped develop theoretical computer science. Turing wrote about artificial intelligence. He worked at Britain's codebreaking centre.",
        title: 'Alan Turing',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(createChatCompletionMock).toHaveBeenCalledTimes(1);
  });
});
