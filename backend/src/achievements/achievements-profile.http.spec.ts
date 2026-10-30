import request from 'supertest';

import {
  createAchievementsHttpApp,
  ACHIEVEMENTS_TEST_USER_ID,
  type AchievementsHttpTestApp,
} from './testing/create-achievements-http-app';

const path = `/achievements/profile/${ACHIEVEMENTS_TEST_USER_ID}`;

describe('Achievements profile errors and authorization (HTTP)', () => {
  let testApp: AchievementsHttpTestApp;

  beforeEach(async () => {
    testApp = await createAchievementsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each([{ method: 'get', suffix: '', body: {} }] as const)(
    'returns a domain 404 for a missing user on $method $suffix',
    async ({ method, suffix, body }) => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      await request(testApp.server)
        [method](`${path}${suffix}`)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(404, {
          statusCode: 404,
          code: 'ACHIEVEMENTS_USER_NOT_FOUND',
          message: 'User not found.',
        });
      expect(testApp.prisma.user.updateMany).not.toHaveBeenCalled();
      expect(testApp.prisma.userAchievement.findMany).not.toHaveBeenCalled();
    },
  );

  it('keeps the profile shape and learned-word count source unchanged', async () => {
    const response = await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(200);
    expect(response.body).toMatchObject({
      userId: ACHIEVEMENTS_TEST_USER_ID,
      progress: {
        balance: 25,
        lessonsCompleted: 2,
        testsCompleted: 0,
        wordsLearned: 3,
      },
    });
    expect(response.body).toHaveProperty('achievements.length', 4);
    expect(response.body).not.toHaveProperty('code');
    expect(testApp.prisma.dictionaryWord.count).toHaveBeenCalledWith({
      where: { progress: 'learned', userId: ACHIEVEMENTS_TEST_USER_ID },
    });
    expect(testApp.prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([{ method: 'get', suffix: '', body: {} }] as const)(
    'rejects another route owner on $method $suffix before persistence',
    async ({ method, suffix, body }) => {
      await request(testApp.server)
        [method](
          `/achievements/profile/22222222-2222-4222-8222-222222222222${suffix}`,
        )
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(403, {
          statusCode: 403,
          code: 'AUTH_OWNERSHIP_DENIED',
          message: 'Authenticated user does not match route user.',
        });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
      expect(testApp.prisma.user.updateMany).not.toHaveBeenCalled();
    },
  );

  it('rejects missing authentication before persistence', async () => {
    await request(testApp.server).get(path).expect(401, {
      statusCode: 401,
      code: 'AUTH_AUTHENTICATION_REQUIRED',
      message: 'Authentication is required.',
    });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('hides unexpected progress-query failures', async () => {
    testApp.prisma.dictionaryWord.count.mockRejectedValue(
      new Error('secret database details'),
    );
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });
});
