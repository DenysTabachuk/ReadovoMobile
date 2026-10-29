import request from 'supertest';

import {
  createNotificationsHttpApp,
  NOTIFICATIONS_TEST_TOKEN,
  NOTIFICATIONS_TEST_USER_ID,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';

const ownerRoutes = [
  {
    method: 'get',
    path: `preferences/${NOTIFICATIONS_TEST_USER_ID}`,
    body: {},
  },
  {
    method: 'put',
    path: `preferences/${NOTIFICATIONS_TEST_USER_ID}`,
    body: { learningRemindersEnabled: true },
  },
  {
    method: 'post',
    path: `push-token/${NOTIFICATIONS_TEST_USER_ID}`,
    body: NOTIFICATIONS_TEST_TOKEN,
  },
  {
    method: 'delete',
    path: `push-token/${NOTIFICATIONS_TEST_USER_ID}?deviceId=test-device`,
    body: {},
  },
  { method: 'post', path: `test-push/${NOTIFICATIONS_TEST_USER_ID}`, body: {} },
  {
    method: 'delete',
    path: `learning-reminders/dispatch/today/${NOTIFICATIONS_TEST_USER_ID}`,
    body: {},
  },
] as const;

describe('Notification authentication and ownership (HTTP)', () => {
  let testApp: NotificationsHttpTestApp;
  beforeEach(async () => {
    testApp = await createNotificationsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it.each([
    ...ownerRoutes,
    { method: 'post', path: 'learning-reminders/dispatch', body: {} },
  ] as const)(
    'requires authentication on $method $path',
    async ({ method, path, body }) => {
      await request(testApp.server)
        [method](`/notifications/${path}`)
        .send(body)
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.',
        });
    },
  );

  it.each(ownerRoutes)(
    'rejects another route owner on $method $path',
    async ({ method, path, body }) => {
      const otherOwnerPath = path.replace(
        NOTIFICATIONS_TEST_USER_ID,
        '22222222-2222-4222-8222-222222222222',
      );
      await request(testApp.server)
        [method](`/notifications/${otherOwnerPath}`)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(403, {
          statusCode: 403,
          code: 'AUTH_OWNERSHIP_DENIED',
          message: 'Authenticated user does not match route user.',
        });
    },
  );
});
