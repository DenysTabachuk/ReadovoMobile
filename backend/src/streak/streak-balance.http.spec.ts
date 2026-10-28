import request from 'supertest';

import {
  createStreakHttpApp,
  STREAK_TEST_NOW,
  type StreakHttpTestApp,
} from './testing/create-streak-http-app';

describe('Streak restore and token-purchase errors (HTTP)', () => {
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

  it.each([
    {
      operation: 'restore',
      code: 'STREAK_RESTORE_PRICE_INVALID',
      message: 'Invalid restore price.',
    },
    {
      operation: 'freeze-token/purchase',
      code: 'STREAK_FREEZE_TOKEN_PRICE_INVALID',
      message: 'Invalid freeze token price.',
    },
  ])(
    'rejects a stale or manipulated price on $operation',
    async ({ operation, code, message }) => {
      await request(testApp.server)
        .post(`/streak/profile/me/${operation}`)
        .set('Authorization', testApp.authorization)
        .send({ price: 99 })
        .expect(400, { statusCode: 400, code, message });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
      expect(testApp.prisma.user.update).not.toHaveBeenCalled();
    },
  );

  it('rejects restore when there is no restorable break', async () => {
    await request(testApp.server)
      .post('/streak/profile/me/restore')
      .set('Authorization', testApp.authorization)
      .send({ price: 100 })
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_RESTORE_UNAVAILABLE',
        message: 'Restore is not available.',
      });
    expect(testApp.prisma.user.update).not.toHaveBeenCalled();
  });

  it.each(['restore', 'freeze-token/purchase'])(
    'rejects insufficient coins on %s without charging the user',
    async (operation) => {
      testApp.prisma.userStreakProfile.upsert.mockResolvedValue({
        ...testApp.profile,
        brokenStreakInfo: {
          brokenAt: '2026-10-27',
          canRestore: true,
          previousStreak: 3,
          restorePrice: 100,
        },
      });
      await request(testApp.server)
        .post(`/streak/profile/me/${operation}`)
        .set('Authorization', testApp.authorization)
        .send({ price: 100 })
        .expect(400, {
          statusCode: 400,
          code: 'STREAK_NOT_ENOUGH_COINS',
          message: 'Not enough coins.',
        });
      expect(testApp.prisma.user.update).not.toHaveBeenCalled();
      expect(testApp.prisma.userStreakProfile.update).not.toHaveBeenCalled();
    },
  );

  it('rejects purchase when the token inventory is full', async () => {
    testApp.prisma.userStreakProfile.upsert.mockResolvedValue({
      ...testApp.profile,
      freezeTokens: 3,
    });
    await request(testApp.server)
      .post('/streak/profile/me/freeze-token/purchase')
      .set('Authorization', testApp.authorization)
      .send({ price: 100 })
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_FREEZE_TOKEN_LIMIT_REACHED',
        message: 'Freeze token limit reached.',
      });
    expect(testApp.prisma.user.update).not.toHaveBeenCalled();
    expect(testApp.prisma.userStreakProfile.update).not.toHaveBeenCalled();
  });
});
