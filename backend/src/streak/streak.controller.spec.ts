import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';

import { JwtService } from '../auth/jwt.service';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { configureRequestValidation } from '../common/validation/configure-request-validation';
import { StreakController } from './streak.controller';
import { StreakService } from './streak.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const USER = {
  id: USER_ID,
  email: 'reader@example.test',
  balance: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  lessonsCompleted: 0,
  testsCompleted: 0,
  wordsLearned: 0,
};
const CALENDAR = {
  days: [],
  year: 2026,
  month: 7,
  monthLabel: 'July 2026',
  serverNow: '2026-07-10T12:00:00.000Z',
  timezone: 'Europe/Kyiv',
};
const PATH = '/streak/profile/me/calendar/month';
const OPERATIONS = [
  {
    path: '/streak/profile/me',
    method: 'get',
    service: 'getProfile',
    body: undefined,
    args: [],
  },
  {
    path: '/streak/profile/me/restore',
    method: 'post',
    service: 'restore',
    body: { price: 10 },
    args: [10],
  },
  {
    path: '/streak/profile/me/freeze',
    method: 'post',
    service: 'applyFreeze',
    body: { date: '2026-07-08' },
    args: ['2026-07-08'],
  },
  {
    path: '/streak/profile/me/freeze-token/purchase',
    method: 'post',
    service: 'purchaseFreezeToken',
    body: { price: 5 },
    args: [5],
  },
] as const;

describe('StreakController current-user routes', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let token: string;
  const service = {
    getCalendarMonth: jest.fn().mockResolvedValue(CALENDAR),
    getProfile: jest.fn().mockResolvedValue({ currentStreak: 3 }),
    completeActivity: jest
      .fn()
      .mockResolvedValue({ streak: { currentStreak: 3 } }),
    restore: jest.fn().mockResolvedValue({ currentStreak: 3 }),
    applyFreeze: jest.fn().mockResolvedValue({ currentStreak: 3 }),
    purchaseFreezeToken: jest.fn().mockResolvedValue({ currentStreak: 3 }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [StreakController],
      providers: [
        JwtService,
        UserAuthGuard,
        { provide: StreakService, useValue: service },
      ],
    }).compile();
    app = module.createNestApplication();
    configureRequestValidation(app);
    await app.init();
    jwt = module.get(JwtService);
    token = jwt.issueAccessToken(USER).accessToken;
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it('derives the owner from the token and parses the selected month', async () => {
    await request(app.getHttpServer())
      .get(`${PATH}?year=2026&month=7`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, CALENDAR);
    expect(service.getCalendarMonth).toHaveBeenCalledWith(USER_ID, 2026, 7);
  });

  it('uses the other owner after changing accounts', async () => {
    const otherToken = jwt.issueAccessToken({
      ...USER,
      id: OTHER_ID,
    }).accessToken;
    await request(app.getHttpServer())
      .get(`${PATH}?year=2026&month=7`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(service.getCalendarMonth).toHaveBeenCalledWith(OTHER_ID, 2026, 7);
  });

  it.each(['', 'Bearer invalid-token'])(
    'rejects missing or invalid authorization: %s',
    async (authorization) => {
      await request(app.getHttpServer())
        .get(`${PATH}?year=2026&month=7`)
        .set('Authorization', authorization)
        .expect(401);
      expect(service.getCalendarMonth).not.toHaveBeenCalled();
    },
  );

  it('rejects an expired token before calling the service', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(0);
    let expiredToken: string;
    try {
      expiredToken = jwt.issueAccessToken(USER).accessToken;
    } finally {
      clock.mockRestore();
    }
    await request(app.getHttpServer())
      .get(`${PATH}?year=2026&month=7`)
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
    expect(service.getCalendarMonth).not.toHaveBeenCalled();
  });

  it.each([
    'year=2026&month=0',
    'year=2026&month=13',
    'year=1969&month=1',
    'year=2101&month=1',
    'year=invalid&month=1',
    'year=2026',
  ])('keeps query validation for %s', async (query) => {
    await request(app.getHttpServer())
      .get(`${PATH}?${query}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(service.getCalendarMonth).not.toHaveBeenCalled();
  });

  it('rejects a client-supplied owner ID', async () => {
    await request(app.getHttpServer())
      .get(`${PATH}?year=2026&month=7&userId=${OTHER_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(service.getCalendarMonth).not.toHaveBeenCalled();
  });

  it.each(OPERATIONS)(
    '$method $path takes its owner exclusively from the token',
    async (operation) => {
      for (const id of [USER_ID, OTHER_ID]) {
        const ownerToken = jwt.issueAccessToken({ ...USER, id }).accessToken;
        const response =
          operation.method === 'get'
            ? request(app.getHttpServer()).get(operation.path)
            : request(app.getHttpServer())
                .post(operation.path)
                .send(operation.body);
        await response
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(operation.method === 'get' ? 200 : 201);
        expect(service[operation.service]).toHaveBeenLastCalledWith(
          id,
          ...operation.args,
        );
      }
    },
  );

  it.each(OPERATIONS)(
    '$method $path rejects missing, invalid, and expired credentials',
    async (operation) => {
      const clock = jest.spyOn(Date, 'now').mockReturnValue(0);
      let expiredToken: string;
      try {
        expiredToken = jwt.issueAccessToken(USER).accessToken;
      } finally {
        clock.mockRestore();
      }
      for (const authorization of [
        '',
        'Bearer invalid',
        `Bearer ${expiredToken}`,
      ]) {
        const response =
          operation.method === 'get'
            ? request(app.getHttpServer()).get(operation.path)
            : request(app.getHttpServer())
                .post(operation.path)
                .send(operation.body);
        await response.set('Authorization', authorization).expect(401);
      }
      expect(service[operation.service]).not.toHaveBeenCalled();
    },
  );

  it.each(OPERATIONS.filter((operation) => operation.method === 'post'))(
    '$path rejects a client-supplied body owner',
    async (operation) => {
      await request(app.getHttpServer())
        .post(operation.path)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...operation.body, userId: OTHER_ID })
        .expect(400);
      expect(service[operation.service]).not.toHaveBeenCalled();
    },
  );

  it.each([
    { path: 'restore', body: { price: -1 }, service: 'restore' },
    { path: 'freeze', body: { date: '2026-02-30' }, service: 'applyFreeze' },
    {
      path: 'freeze-token/purchase',
      body: { price: '5' },
      service: 'purchaseFreezeToken',
    },
  ] as const)(
    'keeps payload validation for $path',
    async ({ path, body, service: method }) => {
      await request(app.getHttpServer())
        .post(`/streak/profile/me/${path}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
      expect(service[method]).not.toHaveBeenCalled();
    },
  );

  it('does not expose the removed owner-specific profile route', async () => {
    await request(app.getHttpServer())
      .get(`/streak/profile/${OTHER_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(service.getProfile).not.toHaveBeenCalled();
  });

  it('cannot override the profile owner through a query parameter', async () => {
    await request(app.getHttpServer())
      .get(`/streak/profile/me?userId=${OTHER_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(service.getProfile).toHaveBeenCalledWith(USER_ID);
  });
});
