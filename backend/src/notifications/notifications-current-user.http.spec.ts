import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { JwtService } from '../auth/jwt.service';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const routes = [
  {
    method: 'get',
    path: '/notifications/preferences/me',
    operation: 'getLearningReminderPreferences',
    arguments: [],
    body: {},
    status: 200,
  },
  {
    method: 'put',
    path: '/notifications/preferences/me',
    operation: 'upsertLearningReminderPreferences',
    arguments: [
      {
        learningRemindersEnabled: true,
      },
    ],
    body: {
      learningRemindersEnabled: true,
    },
    status: 200,
  },
  {
    method: 'post',
    path: '/notifications/push-token/me',
    operation: 'registerPushToken',
    arguments: [
      {
        deviceId: 'device-42',
        platform: 'android',
        provider: 'fcm',
        pushToken: '0123456789abcdef0123456789abcdef',
      },
    ],
    body: {
      deviceId: 'device-42',
      platform: 'android',
      provider: 'fcm',
      pushToken: '0123456789abcdef0123456789abcdef',
    },
    status: 201,
  },
  {
    method: 'delete',
    path: '/notifications/push-token/me?deviceId=device-42',
    operation: 'deactivatePushToken',
    arguments: ['device-42'],
    body: {},
    status: 200,
  },
  {
    method: 'post',
    path: '/notifications/test-push/me',
    operation: 'sendTestPush',
    arguments: [{}],
    body: {},
    status: 201,
  },
  {
    method: 'delete',
    path: '/notifications/learning-reminders/dispatch/today/me',
    operation: 'clearTodayLearningReminderDispatch',
    arguments: [],
    body: {},
    status: 200,
  },
] as const;
const ownerIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
];
const EXPIRED_TOKEN_AGE_MS = 60 * 60 * 1000;

describe('Notifications current-user contract (HTTP)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const createService = () => ({
    getLearningReminderPreferences: jest.fn().mockResolvedValue({}),
    upsertLearningReminderPreferences: jest.fn().mockResolvedValue({}),
    registerPushToken: jest.fn().mockResolvedValue({}),
    deactivatePushToken: jest.fn().mockResolvedValue({}),
    sendTestPush: jest.fn().mockResolvedValue({}),
    clearTodayLearningReminderDispatch: jest.fn().mockResolvedValue({}),
  });
  let service: ReturnType<typeof createService>;

  beforeEach(async () => {
    service = createService();
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        JwtService,
        UserAuthGuard,
        { provide: NotificationsService, useValue: service },
      ],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      logger: false,
      bodyParser: false,
    });
    configureApiBoundaries(app);
    await app.init();
    jwt = module.get(JwtService);
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it.each(routes)(
    'uses the verified token owner on $method $path across accounts',
    async (route) => {
      for (const id of ownerIds) {
        const { accessToken } = jwt.issueAccessToken({
          id,
          email: 'reader@example.test',
          createdAt: '2026-10-30T00:00:00Z',
          balance: 0,
          lessonsCompleted: 0,
          testsCompleted: 0,
          wordsLearned: 0,
        });
        await request(app.getHttpServer())
          [route.method](route.path)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(route.body)
          .expect(route.status);
        expect(service[route.operation]).toHaveBeenLastCalledWith(
          id,
          ...route.arguments,
        );
      }
    },
  );

  it.each(routes)(
    'rejects invalid and expired tokens before $method $path execution',
    async (route) => {
      const clock = jest
        .spyOn(Date, 'now')
        .mockReturnValue(Date.now() - EXPIRED_TOKEN_AGE_MS);
      const { accessToken } = jwt.issueAccessToken({
        id: ownerIds[0],
        email: 'reader@example.test',
        createdAt: '2026-10-30T00:00:00Z',
        balance: 0,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 0,
      });
      clock.mockRestore();
      for (const token of ['invalid-token', accessToken]) {
        await request(app.getHttpServer())
          [route.method](route.path)
          .set('Authorization', `Bearer ${token}`)
          .send(route.body)
          .expect(401);
      }
      expect(service[route.operation]).not.toHaveBeenCalled();
    },
  );

  it.each(
    routes.filter((route) => route.method === 'post' || route.method === 'put'),
  )(
    'rejects a body-supplied owner before $method $path execution',
    async (route) => {
      const { accessToken } = jwt.issueAccessToken({
        id: ownerIds[0],
        email: 'reader@example.test',
        createdAt: '2026-10-30T00:00:00Z',
        balance: 0,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 0,
      });
      const response = await request(app.getHttpServer())
        [route.method](route.path)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...route.body, userId: ownerIds[1] })
        .expect(400);
      expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(service[route.operation]).not.toHaveBeenCalled();
    },
  );

  it('rejects a query-supplied owner before device deactivation', async () => {
    const { accessToken } = jwt.issueAccessToken({
      id: ownerIds[0],
      email: 'reader@example.test',
      createdAt: '2026-10-30T00:00:00Z',
      balance: 0,
      lessonsCompleted: 0,
      testsCompleted: 0,
      wordsLearned: 0,
    });
    const response = await request(app.getHttpServer())
      .delete('/notifications/push-token/me')
      .query({ deviceId: 'device-42', userId: ownerIds[1] })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
    expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(service.deactivatePushToken).not.toHaveBeenCalled();
  });
});
