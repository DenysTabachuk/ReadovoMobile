import request, { type Response } from 'supertest';

import { exportOpenApi } from '../openapi/export-openapi';
import {
  createStreakHttpApp,
  STREAK_TEST_NOW,
  STREAK_TEST_USER_ID,
  type StreakHttpTestApp,
} from './testing/create-streak-http-app';
import { createStreakResponseAssertion } from './testing/create-streak-response-assertion';

describe('Streak profile and calendar OpenAPI wire contract (HTTP)', () => {
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

  it('preserves required null fields and locked achievement timestamps', async () => {
    const response = await request(testApp.server)
      .get('/streak/profile/me')
      .set('Authorization', testApp.authorization)
      .expect(200)
      .expect((response: Response) =>
        assertResponse('getStreakProfile', response),
      );
    expect(response.body).toMatchObject({
      activityHistory: [],
      brokenStreakInfo: null,
      lastActivityDate: null,
      todayStatus: 'pending',
      serverNow: STREAK_TEST_NOW,
      nextMilestone: 3,
      claimedStreakAchievements: [
        { milestone: 3, claimedAt: null, isUnlocked: false, rewardCoins: 30 },
        { milestone: 7, claimedAt: null, isUnlocked: false, rewardCoins: 70 },
        { milestone: 14, claimedAt: null, isUnlocked: false, rewardCoins: 150 },
        { milestone: 30, claimedAt: null, isUnlocked: false, rewardCoins: 400 },
        {
          milestone: 100,
          claimedAt: null,
          isUnlocked: false,
          rewardCoins: 1500,
        },
      ],
    });
  });

  it('serializes break details, local date-only fields and claimed ISO timestamps', async () => {
    testApp.prisma.userStreakProfile.upsert.mockResolvedValue({
      ...testApp.profile,
      brokenStreakInfo: {
        brokenAt: '2026-10-27',
        canRestore: true,
        previousStreak: 3,
      },
    });
    testApp.prisma.userStreakHistory.findMany.mockResolvedValue([
      {
        userId: STREAK_TEST_USER_ID,
        activityDate: new Date('2026-10-27T00:00:00.000Z'),
        status: 'missed',
        createdAt: new Date(STREAK_TEST_NOW),
      },
    ]);
    testApp.prisma.userStreakAchievement.findMany.mockResolvedValue([
      {
        userId: STREAK_TEST_USER_ID,
        milestone: 3,
        rewardCoins: 30,
        claimedAt: new Date('2026-10-25T12:00:00.000Z'),
      },
    ]);
    const response = await request(testApp.server)
      .get('/streak/profile/me')
      .set('Authorization', testApp.authorization)
      .expect(200)
      .expect((response: Response) =>
        assertResponse('getStreakProfile', response),
      );
    expect(response.body).toMatchObject({
      brokenStreakInfo: {
        brokenAt: '2026-10-27',
        canRestore: true,
        previousStreak: 3,
      },
      activityHistory: [{ date: '2026-10-27', status: 'missed' }],
      todayStatus: 'broken',
    });
    expect(response.body).toHaveProperty(
      'claimedStreakAchievements.0.claimedAt',
      '2026-10-25T12:00:00.000Z',
    );
  });

  it('converts numeric query text and returns calendar dates and statuses', async () => {
    const response = await request(testApp.server)
      .get('/streak/profile/me/calendar/month?year=2026&month=10')
      .set('Authorization', testApp.authorization)
      .expect(200)
      .expect((response: Response) =>
        assertResponse('getStreakCalendarMonth', response),
      );
    expect(response.body).toMatchObject({
      year: 2026,
      month: 10,
      timezone: 'UTC',
      serverNow: STREAK_TEST_NOW,
    });
    expect(response.body).toHaveProperty('days.0', {
      date: '2026-10-01',
      dayOfMonth: 1,
      status: 'neutral',
    });
    expect(response.body).toHaveProperty('days.27', {
      date: '2026-10-28',
      dayOfMonth: 28,
      status: 'today_pending',
    });
    expect(response.body).toHaveProperty('days.28.status', 'future');
  });

  it.each([
    'year=2026',
    'year=2026&month=13',
    'year=2026&month=1.5',
    'year=2026&month=10&extra=1',
  ])('documents rejected query input before persistence: %s', async (query) => {
    const response = await request(testApp.server)
      .get(`/streak/profile/me/calendar/month?${query}`)
      .set('Authorization', testApp.authorization)
      .expect(400)
      .expect((response: Response) =>
        assertResponse('getStreakCalendarMonth', response),
      );
    expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('documents future-month business rejection alongside validation errors', async () => {
    await request(testApp.server)
      .get('/streak/profile/me/calendar/month?year=2026&month=11')
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'STREAK_CALENDAR_MONTH_UNAVAILABLE',
        message: 'Future months are not available.',
      })
      .expect((response: Response) =>
        assertResponse('getStreakCalendarMonth', response),
      );
  });

  it('describes query ranges, required nullability and normalized freeze input', async () => {
    const document = await exportOpenApi();
    expect(
      document.paths['/streak/profile/me/calendar/month']?.get?.parameters,
    ).toMatchObject([
      {
        name: 'month',
        in: 'query',
        required: true,
        schema: { type: 'integer', minimum: 1, maximum: 12 },
      },
      {
        name: 'year',
        in: 'query',
        required: true,
        schema: { type: 'integer', minimum: 1970, maximum: 2100 },
      },
    ]);
    expect(document.components?.schemas).toMatchObject({
      ApplyStreakFreezeRequest: {
        additionalProperties: false,
        required: ['date'],
        properties: { date: { type: 'string', format: 'date' } },
      },
      StreakAchievementMilestone: { enum: [3, 7, 14, 30, 100] },
      StreakState: {
        required: [
          'activityHistory',
          'brokenStreakInfo',
          'claimedStreakAchievements',
          'coinBalance',
          'currentStreak',
          'freezeTokenPrice',
          'freezeTokens',
          'lastActivityDate',
          'longestStreak',
          'nextBonusInDays',
          'nextMilestone',
          'restorePrice',
          'serverNow',
          'todayStatus',
        ],
        properties: {
          lastActivityDate: { type: 'string', format: 'date', nullable: true },
          serverNow: { type: 'string', format: 'date-time' },
          brokenStreakInfo: {
            oneOf: [
              { $ref: '#/components/schemas/BrokenStreakInfo' },
              { type: 'object', nullable: true, enum: [null] },
            ],
          },
        },
      },
    });
  });
});
