import request from 'supertest';

import {
  createStreakHttpApp,
  STREAK_TEST_NOW,
  STREAK_TEST_USER_ID,
  type StreakHttpTestApp,
} from './testing/create-streak-http-app';

describe('Streak activity timezone (HTTP)', () => {
  let testApp: StreakHttpTestApp;

  beforeEach(async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'],
    });
    jest.setSystemTime(new Date(STREAK_TEST_NOW));
    testApp = await createStreakHttpApp();
    testApp.prisma.userStreakProfile.upsert.mockResolvedValue({
      ...testApp.profile,
      timezone: 'Europe/Kyiv',
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: new Date('2026-10-28T00:00:00.000Z'),
    });
    // Activity was already recorded today: these cases exercise timezone handling
    // without performing unrelated streak/reward mutations.
    const today = {
      userId: STREAK_TEST_USER_ID,
      activityDate: new Date('2026-10-28T00:00:00.000Z'),
      status: 'completed',
      createdAt: new Date(STREAK_TEST_NOW),
    } as const;
    testApp.prisma.userStreakHistory.findUnique.mockResolvedValue(today);
    testApp.prisma.userStreakHistory.findMany.mockResolvedValue([today]);
  });

  afterEach(async () => {
    await testApp.app.close();
    jest.useRealTimers();
  });

  it('trims and accepts a valid timezone before updating the profile', async () => {
    await request(testApp.server)
      .post('/streak/profile/me/activity-completed')
      .set('Authorization', testApp.authorization)
      .send({
        activityType: 'article_quiz_completed',
        timezone: ' Europe/Paris ',
      })
      .expect(201);
    expect(testApp.prisma.userStreakProfile.upsert).toHaveBeenNthCalledWith(1, {
      create: { timezone: 'Europe/Paris', userId: STREAK_TEST_USER_ID },
      update: { timezone: 'Europe/Paris' },
      where: { userId: STREAK_TEST_USER_ID },
    });
    expect(testApp.prisma.userStreakProfile.upsert).toHaveBeenNthCalledWith(2, {
      create: { timezone: 'UTC', userId: STREAK_TEST_USER_ID },
      update: {},
      where: { userId: STREAK_TEST_USER_ID },
    });
  });

  it.each([
    { name: 'omitted timezone', body: {} },
    { name: 'optional null timezone', body: { timezone: null } },
  ])('preserves the stored timezone for $name', async ({ body }) => {
    await request(testApp.server)
      .post('/streak/profile/me/activity-completed')
      .set('Authorization', testApp.authorization)
      .send({ activityType: 'article_quiz_completed', ...body })
      .expect(201);
    expect(testApp.prisma.userStreakProfile.upsert).toHaveBeenNthCalledWith(1, {
      create: { timezone: 'UTC', userId: STREAK_TEST_USER_ID },
      update: {},
      where: { userId: STREAK_TEST_USER_ID },
    });
  });

  it.each(['Not/A_Timezone', '', 42])(
    'rejects invalid timezone %s in the DTO before persistence',
    async (timezone) => {
      const response = await request(testApp.server)
        .post('/streak/profile/me/activity-completed')
        .set('Authorization', testApp.authorization)
        .send({ activityType: 'article_quiz_completed', timezone })
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: ['timezone'], rule: 'TIMEZONE_INVALID' }] },
      });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
      expect(testApp.prisma.userStreakProfile.upsert).not.toHaveBeenCalled();
    },
  );
});
