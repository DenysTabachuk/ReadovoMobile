import request from 'supertest';

import {
  createArticleLibraryHttpApp,
  LIBRARY_TEST_ARTICLE,
  LIBRARY_TEST_USER_ID,
  type ArticleLibraryHttpTestApp,
} from '../testing/create-article-library-http-app';

const routes = [
  { method: 'get', suffix: 'saved' },
  { method: 'post', suffix: 'saved' },
  { method: 'delete', suffix: 'saved/42' },
  { method: 'get', suffix: 'recent' },
  { method: 'post', suffix: 'recent' },
] as const;
const basePath = `/api/users/${LIBRARY_TEST_USER_ID}/articles`;

describe('Article library errors and access (HTTP)', () => {
  let testApp: ArticleLibraryHttpTestApp;
  beforeEach(async () => {
    testApp = await createArticleLibraryHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each(routes)(
    'returns a domain 404 for a missing user on $method $suffix',
    async ({ method, suffix }) => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      await request(testApp.server)
        [method](`${basePath}/${suffix}`)
        .set('Authorization', testApp.authorization)
        .send(method === 'post' ? LIBRARY_TEST_ARTICLE : {})
        .expect(404, {
          statusCode: 404,
          code: 'ARTICLES_USER_NOT_FOUND',
          message: 'User not found.',
        });
      expect(testApp.prisma.userSavedArticle.findMany).not.toHaveBeenCalled();
      expect(testApp.prisma.userSavedArticle.upsert).not.toHaveBeenCalled();
      expect(testApp.prisma.userSavedArticle.deleteMany).not.toHaveBeenCalled();
      expect(testApp.prisma.userRecentArticle.findMany).not.toHaveBeenCalled();
      expect(testApp.prisma.userRecentArticle.upsert).not.toHaveBeenCalled();
      expect(
        testApp.prisma.userRecentArticle.deleteMany,
      ).not.toHaveBeenCalled();
    },
  );

  it.each(routes)(
    'requires authentication on $method $suffix',
    async ({ method, suffix }) => {
      await request(testApp.server)
        [method](`${basePath}/${suffix}`)
        .send(method === 'post' ? LIBRARY_TEST_ARTICLE : {})
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.',
        });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each(routes)(
    'rejects a different owner on $method $suffix',
    async ({ method, suffix }) => {
      await request(testApp.server)
        [method](
          `/api/users/22222222-2222-4222-8222-222222222222/articles/${suffix}`,
        )
        .set('Authorization', testApp.authorization)
        .send(method === 'post' ? LIBRARY_TEST_ARTICLE : {})
        .expect(403, {
          statusCode: 403,
          code: 'AUTH_OWNERSHIP_DENIED',
          message: 'Authenticated user does not match route user.',
        });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each([
    { method: 'post', suffix: 'saved' },
    { method: 'delete', suffix: 'saved/42' },
    { method: 'post', suffix: 'recent' },
  ] as const)(
    'keeps the missing-user code on a refreshed $method $suffix response',
    async ({ method, suffix }) => {
      testApp.prisma.user.findUnique
        .mockResolvedValueOnce({ id: LIBRARY_TEST_USER_ID })
        .mockResolvedValueOnce(null);
      await request(testApp.server)
        [method](`${basePath}/${suffix}`)
        .set('Authorization', testApp.authorization)
        .send(method === 'post' ? LIBRARY_TEST_ARTICLE : {})
        .expect(404, {
          statusCode: 404,
          code: 'ARTICLES_USER_NOT_FOUND',
          message: 'User not found.',
        });
    },
  );

  it('hides unexpected persistence failures', async () => {
    testApp.prisma.userSavedArticle.findMany.mockRejectedValue(
      new Error('private database details'),
    );
    await request(testApp.server)
      .get(`${basePath}/saved`)
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });
});
