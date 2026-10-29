import request from 'supertest';

import {
  createStreakHttpApp,
  STREAK_TEST_NOW,
  STREAK_TEST_USER_ID,
  type StreakHttpTestApp,
} from './testing/create-streak-http-app';

const date = '2026-10-27';
const path = '/streak/profile/me/freeze';

describe('Streak freeze errors (HTTP)', () => {
  let testApp: StreakHttpTestApp;

  beforeEach(async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'],
    });
    jest.setSystemTime(new Date(STREAK_TEST_NOW));
    testApp = await createStreakHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
    jest.useRealTimers();
  });

  it('rejects an invalid date before persistence', async () => {
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ date: '2026-02-30' })
      .expect(400);
    expect(response.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      details: { fields: [{ path: ['date'], rule: 'DATE_INVALID' }] },
    });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an empty freeze-token balance', async () => {
    testApp.prisma.userStreakProfile.upsert.mockResolvedValue({
      ...testApp.profile,
      freezeTokens: 0,
    });
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ date })
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_NO_FREEZE_TOKENS',
        message: 'No freeze tokens available.',
      });
    expect(testApp.prisma.userStreakHistory.updateMany).not.toHaveBeenCalled();
    expect(testApp.prisma.userStreakProfile.update).not.toHaveBeenCalled();
  });

  it.each(['completed', 'frozen', 'restored'] as const)(
    'rejects an already protected %s day',
    async (status) => {
      testApp.prisma.userStreakHistory.findUnique.mockResolvedValue({
        userId: STREAK_TEST_USER_ID,
        activityDate: new Date(`${date}T00:00:00.000Z`),
        status,
        createdAt: new Date(STREAK_TEST_NOW),
      });
      await request(testApp.server)
        .post(path)
        .set('Authorization', testApp.authorization)
        .send({ date })
        .expect(400, {
          statusCode: 400,
          code: 'STREAK_DAY_ALREADY_PROTECTED',
          message: 'This day is already protected.',
        });
      expect(
        testApp.prisma.userStreakHistory.updateMany,
      ).not.toHaveBeenCalled();
      expect(testApp.prisma.userStreakProfile.update).not.toHaveBeenCalled();
    },
  );

  it('rejects a day with no missed-day history', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ date })
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_FREEZE_ONLY_MISSED_DAY',
        message: 'Freeze can only be applied to a missed day.',
      });
    expect(testApp.prisma.userStreakHistory.updateMany).not.toHaveBeenCalled();
    expect(testApp.prisma.userStreakProfile.update).not.toHaveBeenCalled();
  });

  it('rejects a fourth frozen day in the same break', async () => {
    const missed = {
      userId: STREAK_TEST_USER_ID,
      activityDate: new Date(`${date}T00:00:00.000Z`),
      status: 'missed',
      createdAt: new Date(STREAK_TEST_NOW),
    } as const;
    testApp.prisma.userStreakHistory.findUnique.mockResolvedValue(missed);
    testApp.prisma.userStreakHistory.findMany.mockResolvedValue([
      {
        ...missed,
        activityDate: new Date('2026-10-24T00:00:00.000Z'),
        status: 'frozen',
      },
      {
        ...missed,
        activityDate: new Date('2026-10-25T00:00:00.000Z'),
        status: 'frozen',
      },
      {
        ...missed,
        activityDate: new Date('2026-10-26T00:00:00.000Z'),
        status: 'frozen',
      },
      missed,
    ]);
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ date })
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_FREEZE_DAY_LIMIT_REACHED',
        message: 'Freeze day limit reached.',
      });
    expect(testApp.prisma.userStreakHistory.updateMany).not.toHaveBeenCalled();
    expect(testApp.prisma.userStreakProfile.update).not.toHaveBeenCalled();
  });
});
