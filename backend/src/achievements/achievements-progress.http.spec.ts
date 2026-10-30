import request from 'supertest';
import {
  createAchievementsHttpApp,
  ACHIEVEMENTS_TEST_USER_ID,
  type AchievementsHttpTestApp,
} from './testing/create-achievements-http-app';

describe('Retired client-owned progress writes (HTTP)', () => {
  let testApp: AchievementsHttpTestApp;
  beforeEach(async () => {
    testApp = await createAchievementsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each([
    { balance: 10000 },
    { testsCompleted: 100 },
    { wordsLearned: 100, lessonsCompleted: 100 },
  ])('rejects arbitrary progress $body', async (body) => {
    await request(testApp.server)
      .patch(`/achievements/profile/${ACHIEVEMENTS_TEST_USER_ID}/progress`)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(404, {
        statusCode: 404,
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found.',
      });
    expect(testApp.prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
