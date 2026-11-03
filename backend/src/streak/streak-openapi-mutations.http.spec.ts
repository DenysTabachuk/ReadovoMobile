import request, { type Response } from 'supertest';

import {
  createStreakHttpApp,
  STREAK_TEST_NOW,
  STREAK_TEST_USER_ID,
  type StreakHttpTestApp,
} from './testing/create-streak-http-app';
import { createStreakResponseAssertion } from './testing/create-streak-response-assertion';

const routes = [
  {
    method: 'get',
    path: '/streak/profile/me',
    operationId: 'getStreakProfile',
    body: {},
  },
  {
    method: 'get',
    path: '/streak/profile/me/calendar/month?year=2026&month=10',
    operationId: 'getStreakCalendarMonth',
    body: {},
  },
  {
    method: 'post',
    path: '/streak/profile/me/restore',
    operationId: 'restoreBrokenStreak',
    body: {},
  },
  {
    method: 'post',
    path: '/streak/profile/me/freeze',
    operationId: 'applyStreakFreeze',
    body: { date: '2026-10-27' },
  },
  {
    method: 'post',
    path: '/streak/profile/me/freeze-token/purchase',
    operationId: 'purchaseStreakFreezeToken',
    body: {},
  },
] as const;

describe('Streak mutation and protected-error OpenAPI wire contract (HTTP)', () => {
  let testApp: StreakHttpTestApp;
  let assertResponse: Awaited<ReturnType<typeof createStreakResponseAssertion>>;

  beforeAll(async () => {
    assertResponse = await createStreakResponseAssertion();
  });
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

  it.each(routes)(
    'documents missing authentication for $operationId',
    async (route) => {
      await request(testApp.server)
        [route.method](route.path)
        .send(route.body)
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.',
        })
        .expect((response: Response) =>
          assertResponse(route.operationId, response),
        );
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each(routes)(
    'documents the missing user for $operationId',
    async (route) => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      await request(testApp.server)
        [route.method](route.path)
        .send(route.body)
        .set('Authorization', testApp.authorization)
        .expect(404, {
          statusCode: 404,
          code: 'STREAK_USER_NOT_FOUND',
          message: 'User not found.',
        })
        .expect((response: Response) =>
          assertResponse(route.operationId, response),
        );
    },
  );

  it('returns the serialized state with HTTP 201 after a successful token purchase', async () => {
    testApp.prisma.user.findUnique
      .mockResolvedValue({ id: STREAK_TEST_USER_ID, balance: 100 })
      .mockResolvedValueOnce({ id: STREAK_TEST_USER_ID, balance: 200 })
      .mockResolvedValueOnce({ id: STREAK_TEST_USER_ID, balance: 200 });
    testApp.prisma.user.update.mockResolvedValue(undefined);
    testApp.prisma.userStreakProfile.update.mockResolvedValue(undefined);
    testApp.prisma.userStreakProfile.upsert
      .mockResolvedValue({ ...testApp.profile, freezeTokens: 2 })
      .mockResolvedValueOnce(testApp.profile);
    const response = await request(testApp.server)
      .post('/streak/profile/me/freeze-token/purchase')
      .set('Authorization', testApp.authorization)
      .expect(201)
      .expect((response: Response) =>
        assertResponse('purchaseStreakFreezeToken', response),
      );
    expect(response.body).toMatchObject({
      freezeTokens: 2,
      coinBalance: 100,
      serverNow: STREAK_TEST_NOW,
    });
  });

  it('returns date-only restored history and HTTP 201 after a successful restore', async () => {
    testApp.prisma.user.findUnique
      .mockResolvedValue({ id: STREAK_TEST_USER_ID, balance: 100 })
      .mockResolvedValueOnce({ id: STREAK_TEST_USER_ID, balance: 200 })
      .mockResolvedValueOnce({ id: STREAK_TEST_USER_ID, balance: 200 });
    testApp.prisma.user.update.mockResolvedValue(undefined);
    testApp.prisma.userStreakProfile.update.mockResolvedValue(undefined);
    testApp.prisma.userStreakProfile.updateMany.mockResolvedValue({ count: 1 });
    testApp.prisma.userStreakProfile.upsert
      .mockResolvedValue({
        ...testApp.profile,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date('2026-10-27T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        ...testApp.profile,
        brokenStreakInfo: {
          brokenAt: '2026-10-27',
          canRestore: true,
          previousStreak: 1,
        },
      });
    testApp.prisma.userStreakHistory.upsert.mockResolvedValue(undefined);
    testApp.prisma.userStreakHistory.findMany.mockResolvedValue([
      {
        userId: STREAK_TEST_USER_ID,
        activityDate: new Date('2026-10-27T00:00:00.000Z'),
        status: 'restored',
        createdAt: new Date(STREAK_TEST_NOW),
      },
    ]);
    const response = await request(testApp.server)
      .post('/streak/profile/me/restore')
      .set('Authorization', testApp.authorization)
      .expect(201)
      .expect((response: Response) =>
        assertResponse('restoreBrokenStreak', response),
      );
    expect(response.body).toMatchObject({
      currentStreak: 1,
      lastActivityDate: '2026-10-27',
      brokenStreakInfo: null,
      activityHistory: [{ date: '2026-10-27', status: 'restored' }],
      coinBalance: 100,
    });
  });

  it('normalizes the freeze date and returns date-only frozen history with HTTP 201', async () => {
    const missedDay = {
      userId: STREAK_TEST_USER_ID,
      activityDate: new Date('2026-10-27T00:00:00.000Z'),
      status: 'missed',
      createdAt: new Date(STREAK_TEST_NOW),
    } as const;
    testApp.prisma.userStreakHistory.findUnique.mockResolvedValue(missedDay);
    testApp.prisma.userStreakHistory.findMany
      .mockResolvedValue([{ ...missedDay, status: 'frozen' }])
      .mockResolvedValueOnce([missedDay]);
    testApp.prisma.userStreakHistory.updateMany.mockResolvedValue({ count: 1 });
    testApp.prisma.userStreakProfile.update.mockResolvedValue(undefined);
    testApp.prisma.userStreakProfile.updateMany.mockResolvedValue({ count: 1 });
    testApp.prisma.userStreakProfile.upsert
      .mockResolvedValue({
        ...testApp.profile,
        currentStreak: 1,
        longestStreak: 1,
        freezeTokens: 0,
        lastActivityDate: new Date('2026-10-27T00:00:00.000Z'),
      })
      .mockResolvedValueOnce(testApp.profile)
      .mockResolvedValueOnce(testApp.profile);
    const response = await request(testApp.server)
      .post('/streak/profile/me/freeze')
      .set('Authorization', testApp.authorization)
      .send({ date: ' 2026-10-27 ' })
      .expect(201)
      .expect((response: Response) =>
        assertResponse('applyStreakFreeze', response),
      );
    expect(response.body).toMatchObject({
      currentStreak: 1,
      freezeTokens: 0,
      activityHistory: [{ date: '2026-10-27', status: 'frozen' }],
    });
  });

  it.each([
    { date: '2026-02-30' },
    { date: null },
    {},
    { date: '2026-10-27', price: 0 },
  ])('documents DTO rejection for freeze body %j', async (body) => {
    const response = await request(testApp.server)
      .post('/streak/profile/me/freeze')
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(400)
      .expect((response: Response) =>
        assertResponse('applyStreakFreeze', response),
      );
    expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('documents unavailable restore without claiming DTO validation', async () => {
    await request(testApp.server)
      .post('/streak/profile/me/restore')
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_RESTORE_UNAVAILABLE',
        message: 'Restore is not available.',
      })
      .expect((response: Response) =>
        assertResponse('restoreBrokenStreak', response),
      );
  });

  it('documents insufficient token-purchase funds with the existing domain code', async () => {
    await request(testApp.server)
      .post('/streak/profile/me/freeze-token/purchase')
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_NOT_ENOUGH_COINS',
        message: 'Not enough coins.',
      })
      .expect((response: Response) =>
        assertResponse('purchaseStreakFreezeToken', response),
      );
  });
});
