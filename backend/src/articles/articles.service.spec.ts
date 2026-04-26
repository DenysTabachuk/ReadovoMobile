import { BadGatewayException } from '@nestjs/common';

import { ArticlesService } from './articles.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new ArticlesService();
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
  });

  it('maps random Wikipedia pages into article previews', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        query: {
          pages: {
            '1': {
              extract: 'Article preview',
              fullurl: 'https://en.wikipedia.org/wiki/Example',
              pageid: 1,
              thumbnail: { source: 'https://upload.wikimedia.org/example.jpg' },
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
      expect.objectContaining({
        headers: expect.objectContaining({
          'Api-User-Agent': 'SpeaklyMobile/1.0',
        }),
      }),
    );
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
      json: async () => ({
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
      json: async () => ({
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
});
