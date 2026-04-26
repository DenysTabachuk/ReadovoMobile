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

  it('returns article detail text for a page id', async () => {
    fetchMock.mockResolvedValue({
      json: () =>
        Promise.resolve({
          query: {
            pages: {
              '42': {
                extract: 'Full article text',
                fullurl: 'https://en.wikipedia.org/wiki/Answer',
                pageid: 42,
                title: 'Answer',
              },
            },
          },
        }),
      ok: true,
    });

    const article = await service.getArticleDetail(42);

    expect(article).toEqual({
      content: 'Full article text',
      id: 42,
      thumbnailUrl: undefined,
      title: 'Answer',
      url: 'https://en.wikipedia.org/wiki/Answer',
    });
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
        max_completion_tokens: 1024,
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
});
