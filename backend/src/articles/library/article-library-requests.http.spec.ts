import request from 'supertest';

import {
  createArticleLibraryHttpApp,
  LIBRARY_TEST_ARTICLE,
  LIBRARY_TEST_USER_ID,
  type ArticleLibraryHttpTestApp,
} from '../testing/create-article-library-http-app';

const basePath = `/api/users/${LIBRARY_TEST_USER_ID}/articles`;

describe('Article library request and success contracts (HTTP)', () => {
  let testApp: ArticleLibraryHttpTestApp;
  beforeEach(async () => {
    testApp = await createArticleLibraryHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each(['saved', 'recent'])(
    'keeps an empty %s list successful',
    async (suffix) => {
      await request(testApp.server)
        .get(`${basePath}/${suffix}`)
        .set('Authorization', testApp.authorization)
        .expect(200, []);
    },
  );

  it('keeps deleting an absent saved article idempotent', async () => {
    await request(testApp.server)
      .delete(`${basePath}/saved/42`)
      .set('Authorization', testApp.authorization)
      .expect(200, []);
    expect(testApp.prisma.userSavedArticle.deleteMany).toHaveBeenCalledWith({
      where: { articleId: 42, userId: LIBRARY_TEST_USER_ID },
    });
  });

  it('preserves saved article fields and timestamp serialization', async () => {
    testApp.prisma.userSavedArticle.findMany.mockResolvedValue([
      {
        articleId: 42,
        userId: LIBRARY_TEST_USER_ID,
        extract: LIBRARY_TEST_ARTICLE.extract,
        title: LIBRARY_TEST_ARTICLE.title,
        url: LIBRARY_TEST_ARTICLE.url,
        thumbnailUrl: null,
        savedAt: new Date('2026-10-28T12:00:00.000Z'),
      },
    ]);
    await request(testApp.server)
      .post(`${basePath}/saved`)
      .set('Authorization', testApp.authorization)
      .send(LIBRARY_TEST_ARTICLE)
      .expect(201, [
        { ...LIBRARY_TEST_ARTICLE, savedAt: '2026-10-28T12:00:00.000Z' },
      ]);
    expect(testApp.prisma.userSavedArticle.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_articleId: { articleId: 42, userId: LIBRARY_TEST_USER_ID },
        },
      }),
    );
  });

  it('keeps recording recent articles successful with the existing retention limit', async () => {
    await request(testApp.server)
      .post(`${basePath}/recent`)
      .set('Authorization', testApp.authorization)
      .send(LIBRARY_TEST_ARTICLE)
      .expect(201, []);
    expect(testApp.prisma.userRecentArticle.upsert).toHaveBeenCalledTimes(1);
    expect(testApp.prisma.userRecentArticle.findMany).toHaveBeenCalledWith({
      orderBy: { openedAt: 'desc' },
      select: { articleId: true },
      take: 50,
      where: { userId: LIBRARY_TEST_USER_ID },
    });
  });

  it.each(['saved', 'recent'])(
    'validates %s payloads before persistence',
    async (suffix) => {
      const response = await request(testApp.server)
        .post(`${basePath}/${suffix}`)
        .set('Authorization', testApp.authorization)
        .send({ ...LIBRARY_TEST_ARTICLE, id: 0, title: ' ', url: 'invalid' })
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
      });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it('validates the numeric article route parameter before deletion', async () => {
    const response = await request(testApp.server)
      .delete(`${basePath}/saved/invalid`)
      .set('Authorization', testApp.authorization)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.prisma.userSavedArticle.deleteMany).not.toHaveBeenCalled();
  });
});
