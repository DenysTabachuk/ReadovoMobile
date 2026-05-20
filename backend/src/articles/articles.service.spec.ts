import { BadGatewayException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { ArticlesService } from './articles.service';

const createChatCompletionMock = jest.fn();

jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: createChatCompletionMock,
      },
    },
  })),
}));

describe('ArticlesService', () => {
  let service: ArticlesService;
  let fetchMock: jest.Mock;
  let queryMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    queryMock = jest.fn();
    queryMock.mockResolvedValue({ rows: [] });
    global.fetch = fetchMock as typeof fetch;
    createChatCompletionMock.mockReset();
    process.env.GROQ_API_KEY = 'test-key';

    service = new ArticlesService({
      query: queryMock,
    } as unknown as DatabaseService);
  });

  afterEach(() => {
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
    jest
      .spyOn(service as never, 'renderFormulaBlocks' as never)
      .mockResolvedValue([
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
      rows: [
        {
          adapted_length: 32,
          adapted_text: 'Simple text about the Solar System.',
          level: 'A2',
          original_length: 120,
          target_length: 'short',
          title: 'Solar System',
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      targetPercent: 25,
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(createChatCompletionMock).not.toHaveBeenCalled();
    expect(response).toEqual({
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
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
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
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      targetPercent: 25,
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(createChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        max_completion_tokens: 32768,
        model: 'llama-3.3-70b-versatile',
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
      title: 'Solar System',
      transformationType: 'summary',
    });
  });

  it('keeps original length when target percent is 100', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
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
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      targetPercent: 100,
      text: 'Long article text',
      title: 'Solar System',
    });
    const request = createChatCompletionMock.mock.calls[0]?.[0] as {
      messages: Array<{ content?: string }>;
    };
    const prompt = String(request.messages[1]?.content ?? '');

    expect(prompt).toContain('Summarize and shorten the article');
    expect(prompt).toContain('Hard maximum');
    expect(response.transformationType).toBe('summary');
  });

  it('parses structured simplification response with blocks and questions', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
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
      targetPercent: 25,
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

  it('falls back to plain text paragraphs when adaptation response is not valid JSON', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
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

    const response = await service.simplifyArticle({
      level: 'A2',
      text: 'Long article text',
      title: 'Architecture',
      transformationType: 'adaptation',
    });

    expect(response.adaptedBlocks).toEqual([
      {
        children: [
          {
            text: 'Architecture is the art and practice of designing buildings.',
            type: 'text',
          },
        ],
        type: 'paragraph',
      },
      {
        children: [
          {
            text: 'It also includes planning spaces for people to use.',
            type: 'text',
          },
        ],
        type: 'paragraph',
      },
    ]);
    expect(response.transformationType).toBe('adaptation');
  });

  it('falls back when adaptedBlocks is an array of strings', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              adaptedBlocks: [
                'Architecture is about designing buildings.',
                'It also plans how people use space.',
              ],
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      text: 'Long article text',
      title: 'Architecture',
      transformationType: 'adaptation',
    });

    expect(response.adaptedBlocks).toEqual([
      {
        children: [
          {
            text: 'Architecture is about designing buildings.',
            type: 'text',
          },
        ],
        type: 'paragraph',
      },
      {
        children: [
          {
            text: 'It also plans how people use space.',
            type: 'text',
          },
        ],
        type: 'paragraph',
      },
    ]);
  });

  it('falls back when adaptation text is nested in a loose JSON field', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              result: {
                paragraphs: [
                  'Architecture is the design of buildings.',
                  'It also shapes the spaces around them.',
                ],
              },
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      text: 'Long article text',
      title: 'Architecture',
      transformationType: 'adaptation',
    });

    expect(response.adaptedBlocks).toEqual([
      {
        children: [
          {
            text: 'Architecture is the design of buildings.',
            type: 'text',
          },
        ],
        type: 'paragraph',
      },
      {
        children: [
          {
            text: 'It also shapes the spaces around them.',
            type: 'text',
          },
        ],
        type: 'paragraph',
      },
    ]);
  });

  it('normalizes table rows returned as row objects', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              adaptedBlocks: [
                {
                  rows: [
                    {
                      cells: [
                        { header: true, text: 'Company' },
                        { header: true, text: 'Industry' },
                      ],
                    },
                    {
                      cells: [
                        { text: 'Electronic Arts' },
                        { text: 'Video games' },
                      ],
                    },
                  ],
                  type: 'table',
                },
              ],
            }),
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      targetPercent: 25,
      text: 'Electronic Arts is a video game company.',
      title: 'Electronic Arts',
    });

    expect(response.adaptedBlocks).toEqual([
      {
        rows: [
          [
            { header: true, text: 'Company' },
            { header: true, text: 'Industry' },
          ],
          [{ text: 'Electronic Arts' }, { text: 'Video games' }],
        ],
        type: 'table',
      },
    ]);
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
                content: JSON.stringify({
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
      targetPercent: 25,
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
              content: JSON.stringify({
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
              content: JSON.stringify({
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
              content: JSON.stringify({
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
      targetPercent: 25,
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

  it('generates a structured vocabulary quiz from article text', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              questions: [
                {
                  correctOptionIds: ['a'],
                  format: 'definition',
                  id: 'vq-1',
                  options: [
                    {
                      id: 'a',
                      text: 'a sudden event when a volcano throws out lava',
                    },
                    { id: 'b', text: 'a machine that measures wind speed' },
                    { id: 'c', text: 'a flat area near a river' },
                    {
                      id: 'd',
                      text: 'a person who climbs mountains for sport',
                    },
                  ],
                  prompt:
                    'Which definition best matches "eruption" in the text?',
                  sourceExcerpt:
                    'Scientists study volcanoes. Lava flows down the mountain during an eruption.',
                  term: 'eruption',
                  termKind: 'word',
                  translation: 'виверження',
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
    const request = createChatCompletionMock.mock.calls[0]?.[0] as {
      messages: Array<{ content?: string }>;
    };
    const prompt = String(request.messages[1]?.content ?? '');

    expect(prompt).toContain('Generate up to 5 questions');
    expect(response).toEqual({
      questions: [
        {
          correctOptionIds: ['a'],
          format: 'definition',
          id: 'vq-1',
          options: [
            { id: 'a', text: 'a sudden event when a volcano throws out lava' },
            { id: 'b', text: 'a machine that measures wind speed' },
            { id: 'c', text: 'a flat area near a river' },
            { id: 'd', text: 'a person who climbs mountains for sport' },
          ],
          prompt: 'Which definition best matches "eruption" in the text?',
          sourceExcerpt:
            'Scientists study volcanoes. Lava flows down the mountain during an eruption.',
          term: 'eruption',
          termKind: 'word',
          translation: 'виверження',
          type: 'single_choice',
        },
      ],
      resolvedLevel: 'B1',
    });
  });

  it('filters out vocabulary quiz questions with invalid target terms', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
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
                  translation: 'С‚Р°С”РјРЅРёС‡РёР№',
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
                  translation: 'С†Рµ',
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
                  translation: 'Р»С–СЃРѕРІРёР№ РїРѕР»РѕРі',
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

    expect(response.questions).toEqual([
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
        translation: 'Р»С–СЃРѕРІРёР№ РїРѕР»РѕРі',
        type: 'single_choice',
      },
    ]);
  });

  it('preserves requested C1 level for vocabulary quiz generation', async () => {
    createChatCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              questions: [
                {
                  correctOptionIds: ['c'],
                  format: 'synonym',
                  id: 'vq-1',
                  options: [
                    { id: 'a', text: 'refusal' },
                    { id: 'b', text: 'delay' },
                    { id: 'c', text: 'uncertainty' },
                    { id: 'd', text: 'victory' },
                  ],
                  prompt:
                    'Which word is closest in meaning to "ambiguity" in the text?',
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
    const request = createChatCompletionMock.mock.calls[0]?.[0] as {
      messages: Array<{ content?: string }>;
    };
    const prompt = String(request.messages[1]?.content ?? '');

    expect(prompt).toContain('Learner level is fixed at C1.');
    expect(prompt).toContain('Set "resolvedLevel" to "C1"');
    expect(response.resolvedLevel).toBe('C1');
  });

  it('recovers complete vocabulary questions from truncated AI JSON', async () => {
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
      "format": "definition",
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
      "format": "definition",
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
      "format": "definition",
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
      "format": "definition",
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

    const response = await service.generateArticleVocabularyQuiz({
      level: 'A2',
      text: "Alan Turing was an English mathematician. The machine could follow an algorithm. He helped develop theoretical computer science. Turing wrote about artificial intelligence. He worked at Britain's codebreaking centre.",
      title: 'Alan Turing',
    });

    expect(response.resolvedLevel).toBe('A2');
    expect(response.questions).toHaveLength(5);
    expect(response.questions.map((question) => question.term)).toEqual([
      'mathematician',
      'algorithm',
      'computer science',
      'artificial intelligence',
      'codebreaking',
    ]);
  });
});
