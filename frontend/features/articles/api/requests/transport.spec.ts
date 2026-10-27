import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';

import { fetchArticleAdaptations } from './fetchArticleAdaptations';
import { fetchWikipediaArticleDetail } from './fetchWikipediaArticleDetail';
import { fetchWikipediaArticles } from './fetchWikipediaArticles';

it('preserves omitted defaults, trimmed search, comma-separated IDs and explicit false', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse([]));
  await fetchWikipediaArticles({
    limit: 7,
    search: ' C++ & tea ',
    excludeIds: [1, 2],
    category: 'all',
    recommended: false,
  });
  expect(adapter.mock.calls[0][0].url).toBe(
    'https://api.example.test/articles?limit=7&search=C%2B%2B+%26+tea&excludeIds=1%2C2&recommended=false',
  );
  expect(adapter.mock.calls[0][0].headers.has('Authorization')).toBe(false);
});
it('preserves language parameters and encoded adaptations with deduplicated IDs', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse({}));
  await fetchWikipediaArticleDetail(42, 'uk');
  expect(adapter.mock.calls[0][0].url).toBe(
    'https://api.example.test/articles/42?languageCode=uk',
  );
  await fetchArticleAdaptations([42, 42, 7], 'summary');
  expect(adapter.mock.calls[1][0].url).toBe(
    'https://api.example.test/api/articles/adaptations?articleIds=42%2C7&transformationType=summary',
  );
});
it('skips empty adaptation requests and maps provider failures to existing errors', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(
    createHttpResponse('Unavailable', { status: 503 }),
  );
  await expect(fetchArticleAdaptations([])).resolves.toEqual({});
  expect(adapter).not.toHaveBeenCalled();
  await expect(fetchWikipediaArticles()).rejects.toThrow(
    'articles.errorDescription',
  );
  await expect(fetchWikipediaArticleDetail(42)).rejects.toThrow(
    'article.errorDescription',
  );
});
