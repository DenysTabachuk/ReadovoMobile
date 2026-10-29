import request from 'supertest';

import {
  createAchievementsHttpApp,
  ACHIEVEMENTS_TEST_USER_ID,
  type AchievementsHttpTestApp,
} from './testing/create-achievements-http-app';

const path = `/achievements/profile/${ACHIEVEMENTS_TEST_USER_ID}/progress`;

describe('Achievements progress input and errors (HTTP)', () => {
  let testApp: AchievementsHttpTestApp;

  beforeEach(async () => {
    testApp = await createAchievementsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each([
    { field: 'balance', body: { balance: -1 } },
    { field: 'lessonsCompleted', body: { lessonsCompleted: 1.5 } },
    { field: 'testsCompleted', body: { testsCompleted: 2_147_483_648 } },
    { field: 'wordsLearned', body: { wordsLearned: '3' } },
  ])(
    'rejects invalid $field through DTO validation',
    async ({ field, body }) => {
      const response = await request(testApp.server)
        .patch(path)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: [field] }] },
      });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
      expect(testApp.prisma.user.updateMany).not.toHaveBeenCalled();
    },
  );

  it('rejects an empty update before persistence', async () => {
    const response = await request(testApp.server)
      .patch(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(testApp.prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'omitted balance', body: { lessonsCompleted: 0 } },
    {
      name: 'optional null balance',
      body: { lessonsCompleted: 0, balance: null },
    },
  ])('preserves zero and current values for $name', async ({ body }) => {
    const response = await request(testApp.server)
      .patch(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(200);
    expect(response.body).toMatchObject({
      userId: ACHIEVEMENTS_TEST_USER_ID,
      progress: {
        balance: 25,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 3,
      },
    });
    expect(response.body).not.toHaveProperty('code');
    expect(testApp.prisma.user.updateMany).toHaveBeenCalledWith({
      data: {
        balance: 25,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 3,
      },
      where: { id: ACHIEVEMENTS_TEST_USER_ID },
    });
  });

  it('returns a domain 404 if the user disappears before the profile is refreshed', async () => {
    testApp.prisma.user.findUnique
      .mockResolvedValueOnce(testApp.user)
      .mockResolvedValueOnce(null);
    await request(testApp.server)
      .patch(path)
      .set('Authorization', testApp.authorization)
      .send({ lessonsCompleted: 0 })
      .expect(404, {
        statusCode: 404,
        code: 'ACHIEVEMENTS_USER_NOT_FOUND',
        message: 'User not found.',
      });
    expect(testApp.prisma.user.updateMany).toHaveBeenCalledTimes(1);
  });
});
