import request, { type Response } from 'supertest';

import { exportOpenApi } from '../openapi/export-openapi';
import {
  createNotificationsHttpApp,
  NOTIFICATIONS_TEST_TOKEN,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';
import { createNotificationsResponseAssertion } from './testing/create-notifications-response-assertion';

const protectedRoutes = [
  {
    method: 'get',
    path: '/notifications/preferences/me',
    operationId: 'getLearningReminderPreferences',
    body: {},
  },
  {
    method: 'put',
    path: '/notifications/preferences/me',
    operationId: 'updateLearningReminderPreferences',
    body: { learningRemindersEnabled: true },
  },
  {
    method: 'post',
    path: '/notifications/push-token/me',
    operationId: 'registerPushToken',
    body: NOTIFICATIONS_TEST_TOKEN,
  },
  {
    method: 'delete',
    path: '/notifications/push-token/me?deviceId=test-device',
    operationId: 'deactivatePushToken',
    body: {},
  },
  {
    method: 'post',
    path: '/notifications/test-push/me',
    operationId: 'sendRemoteTestPush',
    body: {},
  },
  {
    method: 'delete',
    path: '/notifications/learning-reminders/dispatch/today/me',
    operationId: 'clearTodayLearningReminderDispatch',
    body: {},
  },
  {
    method: 'post',
    path: '/notifications/learning-reminders/dispatch',
    operationId: 'dispatchLearningRemindersNow',
    body: {},
  },
] as const;

describe('Notification operation OpenAPI wire contracts (HTTP)', () => {
  let testApp: NotificationsHttpTestApp;
  let previousEnvironment: string | undefined;
  let assertResponse: Awaited<
    ReturnType<typeof createNotificationsResponseAssertion>
  >;
  beforeAll(async () => {
    assertResponse = await createNotificationsResponseAssertion();
  });
  beforeEach(async () => {
    previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    testApp = await createNotificationsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  });

  it('returns literal ok=true for registration with HTTP 201', async () => {
    await request(testApp.server)
      .post('/notifications/push-token/me')
      .set('Authorization', testApp.authorization)
      .send(NOTIFICATIONS_TEST_TOKEN)
      .expect(201, { ok: true })
      .expect((response: Response) =>
        assertResponse('registerPushToken', response),
      );
  });

  it('returns the same acknowledgment with HTTP 200 for a trimmed device query', async () => {
    await request(testApp.server)
      .delete('/notifications/push-token/me?deviceId=%20test-device%20')
      .set('Authorization', testApp.authorization)
      .expect(200, { ok: true })
      .expect((response: Response) =>
        assertResponse('deactivatePushToken', response),
      );
    expect(
      testApp.prisma.userPushToken.updateMany.mock.calls[0]?.[0],
    ).toMatchObject({ where: { deviceId: 'test-device' } });
  });

  it.each(['ios', 'web'])(
    'rejects unsupported platform %s before persistence',
    async (platform) => {
      const response = await request(testApp.server)
        .post('/notifications/push-token/me')
        .set('Authorization', testApp.authorization)
        .send({ ...NOTIFICATIONS_TEST_TOKEN, platform })
        .expect(400)
        .expect((response: Response) =>
          assertResponse('registerPushToken', response),
        );
      expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
      expect(testApp.prisma.userPushToken.upsert).not.toHaveBeenCalled();
    },
  );

  it.each([
    '/notifications/push-token/me',
    '/notifications/push-token/me?deviceId=%20',
  ])('documents invalid device query %s', async (path) => {
    const response = await request(testApp.server)
      .delete(path)
      .set('Authorization', testApp.authorization)
      .expect(400)
      .expect((response: Response) =>
        assertResponse('deactivatePushToken', response),
      );
    expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
  });

  it('accepts an omitted test-push body and returns a 201 zero-token summary', async () => {
    await request(testApp.server)
      .post('/notifications/test-push/me')
      .set('Authorization', testApp.authorization)
      .expect(201, {
        tokenCount: 0,
        sentCount: 0,
        failedCount: 0,
        failureReasons: [],
      })
      .expect((response: Response) =>
        assertResponse('sendRemoteTestPush', response),
      );
  });

  it('keeps unavailable Firebase a delivery outcome instead of a non-2xx response', async () => {
    testApp.prisma.userPushToken.findMany.mockResolvedValue([
      {
        deviceId: 'test-device',
        pushToken: NOTIFICATIONS_TEST_TOKEN.pushToken,
      },
    ]);
    await request(testApp.server)
      .post('/notifications/test-push/me')
      .set('Authorization', testApp.authorization)
      .send({ title: null, body: null })
      .expect(201, {
        tokenCount: 1,
        sentCount: 0,
        failedCount: 1,
        failureReasons: ['Firebase Admin SDK is not configured.'],
      })
      .expect((response: Response) =>
        assertResponse('sendRemoteTestPush', response),
      );
  });

  it('returns the complete manual dispatch counter shape outside production', async () => {
    await request(testApp.server)
      .post('/notifications/learning-reminders/dispatch')
      .set('Authorization', testApp.authorization)
      .expect(201, {
        checkedCount: 0,
        sentCount: 0,
        skippedAlreadySentCount: 0,
        skippedCompletedTodayCount: 0,
        skippedNoTokensCount: 0,
        skippedOutsideWindowCount: 0,
        skippedSendFailedCount: 0,
      })
      .expect((response: Response) =>
        assertResponse('dispatchLearningRemindersNow', response),
      );
  });

  it('returns the cleared record count outside production', async () => {
    await request(testApp.server)
      .delete('/notifications/learning-reminders/dispatch/today/me')
      .set('Authorization', testApp.authorization)
      .expect(200, { deletedCount: 2 })
      .expect((response: Response) =>
        assertResponse('clearTodayLearningReminderDispatch', response),
      );
  });

  it.each([
    {
      method: 'post',
      path: '/notifications/learning-reminders/dispatch',
      operationId: 'dispatchLearningRemindersNow',
      code: 'NOTIFICATIONS_MANUAL_DISPATCH_DISABLED',
      message: 'Manual reminder dispatch is disabled in production.',
    },
    {
      method: 'delete',
      path: '/notifications/learning-reminders/dispatch/today/me',
      operationId: 'clearTodayLearningReminderDispatch',
      code: 'NOTIFICATIONS_DISPATCH_CLEAR_DISABLED',
      message: 'Clearing reminder dispatches is disabled in production.',
    },
  ] as const)(
    'documents the production 403 for $operationId',
    async (route) => {
      process.env.NODE_ENV = 'production';
      await request(testApp.server)
        [route.method](route.path)
        .set('Authorization', testApp.authorization)
        .expect(403, {
          statusCode: 403,
          code: route.code,
          message: route.message,
        })
        .expect((response: Response) =>
          assertResponse(route.operationId, response),
        );
    },
  );

  it.each(protectedRoutes)(
    'documents authentication for $operationId',
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
    },
  );

  it('describes platform/provider enums, query limits and literal acknowledgments', async () => {
    const document = await exportOpenApi();
    expect(document.components?.schemas).toMatchObject({
      RegisterPushTokenRequest: {
        required: ['deviceId', 'platform', 'provider', 'pushToken'],
        additionalProperties: false,
        properties: {
          deviceId: { minLength: 1, maxLength: 256 },
          platform: { enum: ['android'] },
          provider: { enum: ['fcm'] },
          pushToken: { minLength: 32, maxLength: 4096 },
        },
      },
      PushTokenAcknowledgment: {
        required: ['ok'],
        properties: { ok: { type: 'boolean', enum: [true] } },
      },
    });
    expect(
      document.paths['/notifications/push-token/me']?.delete?.parameters,
    ).toMatchObject([
      {
        name: 'deviceId',
        in: 'query',
        required: true,
        schema: { type: 'string', minLength: 1, maxLength: 256 },
      },
    ]);
  });
});
