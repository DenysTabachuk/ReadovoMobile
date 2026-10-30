import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { readSavedArticles } from './readSavedArticles';
import { readRecentArticles } from './readRecentArticles';
import { saveArticleForLater } from './saveArticleForLater';
import { recordRecentArticle } from './recordRecentArticle';
import { removeSavedArticle } from './removeSavedArticle';

jest.mock('@/features/auth', () => ({
  api: jest.requireActual('@/api/httpClient').httpClient,
}));

it('readSavedArticles sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await readSavedArticles();
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/api/users/me/articles/saved',
    method: 'get',
  });
});

it('readRecentArticles sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await readRecentArticles();
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/api/users/me/articles/recent',
    method: 'get',
  });
});

it('saveArticleForLater sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await saveArticleForLater({
    id: 42,
    title: 'Space',
    extract: 'Space',
    url: 'https://example.test/42',
  });
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/api/users/me/articles/saved',
    method: 'post',
  });
  expect(adapter.mock.calls[0][0].data).toBe(
    JSON.stringify({
      id: 42,
      title: 'Space',
      extract: 'Space',
      url: 'https://example.test/42',
    }),
  );
});

it('recordRecentArticle sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await recordRecentArticle({
    id: 42,
    title: 'Space',
    extract: 'Space',
    url: 'https://example.test/42',
  });
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/api/users/me/articles/recent',
    method: 'post',
  });
  expect(adapter.mock.calls[0][0].data).toBe(
    JSON.stringify({
      id: 42,
      title: 'Space',
      extract: 'Space',
      url: 'https://example.test/42',
    }),
  );
});

it('removeSavedArticle sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await removeSavedArticle(42);
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/api/users/me/articles/saved/42',
    method: 'delete',
  });
});
