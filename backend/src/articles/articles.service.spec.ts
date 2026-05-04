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
                extract: 'Article preview',
                fullurl: 'https://en.wikipedia.org/wiki/Example',
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
        'Api-User-Agent': 'SpeaklyMobile/1.0',
      },
    });
    expect(articles).toEqual([
      {
        extract: 'Article preview',
        id: 1,
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
                  'A function of a real variable (usually {\\displaystyle t}) can be mapped to {\\displaystyle s}.',
                fullurl: 'https://en.wikipedia.org/wiki/Laplace_transform',
                pageid: 1,
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
          'A function of a real variable (usually t) can be mapped to s.',
        id: 1,
        thumbnailUrl: undefined,
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
      targetLength: 'short',
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(createChatCompletionMock).not.toHaveBeenCalled();
    expect(response).toEqual({
      adaptedLength: 32,
      adaptedText: 'Simple text about the Solar System.',
      level: 'A2',
      originalLength: 120,
      targetLength: 'short',
      title: 'Solar System',
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
            content: 'The Solar System has the Sun and planets.',
          },
        },
      ],
    });

    const response = await service.simplifyArticle({
      level: 'A2',
      targetLength: 'short',
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(createChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        max_completion_tokens: 2048,
        model: 'llama-3.3-70b-versatile',
      }),
    );
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(response).toEqual({
      adaptedLength: 41,
      adaptedText: 'The Solar System has the Sun and planets.',
      level: 'A2',
      originalLength: 17,
      targetLength: 'short',
      title: 'Solar System',
    });
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
              adaptedText: 'The Sun is a star.',
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
      targetLength: 'short',
      text: 'Long article text',
      title: 'Solar System',
    });

    expect(response.adaptedText).toBe('The Sun is a star.');
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
});
