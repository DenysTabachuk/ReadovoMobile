import request from 'supertest';

import {
  createNotificationsHttpApp,
  NOTIFICATIONS_TEST_TOKEN,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';

const ownerRoutes = [
  {
    method: 'get',
    path: `preferences/me`,
    body: {},
  },
  {
    method: 'put',
    path: `preferences/me`,
    body: { learningRemindersEnabled: true },
  },
  {
    method: 'post',
    path: `push-token/me`,
    body: NOTIFICATIONS_TEST_TOKEN,
  },
  {
    method: 'delete',
    path: `push-token/me?deviceId=test-device`,
    body: {},
  },
  { method: 'post', path: `test-push/me`, body: {} },
  {
    method: 'delete',
    path: `learning-reminders/dispatch/today/me`,
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
});
