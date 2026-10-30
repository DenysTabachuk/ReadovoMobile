import request from 'supertest';

import {
  createStreakHttpApp,
  STREAK_TEST_NOW,
  STREAK_TEST_USER_ID,
  type StreakHttpTestApp,
} from './testing/create-streak-http-app';

describe('Streak profile and calendar errors (HTTP)', () => {
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
    { method: 'get', path: '', body: {} },
    { method: 'get', path: '/calendar/month?year=2026&month=10', body: {} },
    { method: 'post', path: '/restore', body: { price: 100 } },
    { method: 'post', path: '/freeze', body: { date: '2026-10-27' } },
    { method: 'post', path: '/freeze-token/purchase', body: { price: 100 } },
  ] as const)(
    'returns a domain 404 for a missing user on $method $path',
    async ({ method, path, body }) => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      await request(testApp.server)
        [method](`/streak/profile/me${path}`)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(404, {
          statusCode: 404,
          code: 'STREAK_USER_NOT_FOUND',
          message: 'User not found.',
        });
    },
  );

  it('handles a user disappearing before balance lookup', async () => {
    testApp.prisma.user.findUnique
      .mockResolvedValueOnce({ id: STREAK_TEST_USER_ID, balance: 0 })
      .mockResolvedValueOnce(null);
    await request(testApp.server)
      .get('/streak/profile/me')
      .set('Authorization', testApp.authorization)
      .expect(404, {
        statusCode: 404,
        code: 'STREAK_USER_NOT_FOUND',
        message: 'User not found.',
      });
  });

  it('rejects a future calendar month with a domain code', async () => {
    await request(testApp.server)
      .get('/streak/profile/me/calendar/month?year=2026&month=11')
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_CALENDAR_MONTH_UNAVAILABLE',
        message: 'Future months are not available.',
      });
  });

  it.each([
    { query: 'year=1969&month=10', field: 'year' },
    { query: 'year=2101&month=10', field: 'year' },
    { query: 'year=2026.5&month=10', field: 'year' },
    { query: 'year=2026&month=0', field: 'month' },
    { query: 'year=2026&month=13', field: 'month' },
    { query: 'year=2026&month=1.5', field: 'month' },
    { query: 'year=2026', field: 'month' },
    { query: 'month=10', field: 'year' },
  ])(
    'rejects invalid calendar input through DTO validation: $query',
    async ({ query, field }) => {
      const response = await request(testApp.server)
        .get(`/streak/profile/me/calendar/month?${query}`)
        .set('Authorization', testApp.authorization)
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: [field] }] },
      });
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it('accepts a valid calendar month at the minimum year boundary', async () => {
    const response = await request(testApp.server)
      .get('/streak/profile/me/calendar/month?year=1970&month=1')
      .set('Authorization', testApp.authorization)
      .expect(200);
    expect(response.body).toMatchObject({ year: 1970, month: 1 });
    expect(response.body).toHaveProperty('days.length', 31);
  });

  it('hides unexpected database failures', async () => {
    testApp.prisma.user.findUnique.mockRejectedValue(
      new Error('secret database credentials'),
    );
    await request(testApp.server)
      .get('/streak/profile/me')
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });

  it('hides malformed persisted streak data', async () => {
    testApp.prisma.userStreakProfile.upsert.mockResolvedValue({
      ...testApp.profile,
      brokenStreakInfo: { brokenAt: 'invalid' },
    });
    await request(testApp.server)
      .get('/streak/profile/me')
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });

  it('keeps successful profile responses free of error fields', async () => {
    const response = await request(testApp.server)
      .get('/streak/profile/me')
      .set('Authorization', testApp.authorization)
      .expect(200);
    expect(response.body).toMatchObject({
      currentStreak: 0,
      freezeTokens: 1,
      coinBalance: 0,
      activityHistory: [],
      serverNow: STREAK_TEST_NOW,
    });
    expect(response.body).not.toHaveProperty('code');
    expect(response.body).not.toHaveProperty('error');
  });
});
