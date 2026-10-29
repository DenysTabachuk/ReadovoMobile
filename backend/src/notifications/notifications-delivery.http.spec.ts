import { Logger } from '@nestjs/common';
import request from 'supertest';

// Import the factory first so its SDK-discovery mock is installed before use.
import {
  createNotificationsHttpApp,
  NOTIFICATIONS_TEST_TOKEN,
  NOTIFICATIONS_TEST_USER_ID,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';
import {
  deleteApp,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

const path = `/notifications/test-push/${NOTIFICATIONS_TEST_USER_ID}`;
const privateDetails = 'PRIVATE_PROVIDER_DIAGNOSTICS';

describe('Notification delivery diagnostics (HTTP)', () => {
  let testApp: NotificationsHttpTestApp;
  let firebaseApp: App;
  let send: jest.SpyInstance<
    ReturnType<Messaging['send']>,
    Parameters<Messaging['send']>
  >;

  beforeEach(async () => {
    firebaseApp = initializeApp(
      {
        projectId: 'readovo-delivery-test',
        credential: {
          getAccessToken: () =>
            Promise.reject(new Error('Network access disabled in tests.')),
        },
      },
      'notifications-delivery-test',
    );
    send = jest
      .spyOn(getMessaging(firebaseApp), 'send')
      .mockResolvedValue('test-message-id');
    testApp = await createNotificationsHttpApp(firebaseApp);
    testApp.prisma.userPushToken.findMany.mockResolvedValue([
      {
        deviceId: NOTIFICATIONS_TEST_TOKEN.deviceId,
        pushToken: NOTIFICATIONS_TEST_TOKEN.pushToken,
      },
    ]);
  });

  afterEach(async () => {
    await testApp.app.close();
    jest.restoreAllMocks();
    await deleteApp(firebaseApp);
  });

  it.each([
    {
      code: 'messaging/invalid-registration-token',
      deactivate: true,
      reason: 'Push token is invalid or no longer registered.',
    },
    {
      code: 'messaging/registration-token-not-registered',
      deactivate: true,
      reason: 'Push token is invalid or no longer registered.',
    },
    {
      code: 'messaging/server-unavailable',
      deactivate: false,
      reason: 'Push delivery failed.',
    },
    {
      code: `unknown-${privateDetails}`,
      deactivate: false,
      reason: 'Push delivery failed.',
    },
  ])(
    'sanitizes $code while preserving token cleanup',
    async ({ code, deactivate, reason }) => {
      const log = jest.spyOn(Logger.prototype, 'error');
      send.mockRejectedValueOnce(
        Object.assign(new Error(privateDetails), {
          code,
          token: NOTIFICATIONS_TEST_TOKEN.pushToken,
        }),
      );
      await request(testApp.server)
        .post(path)
        .set('Authorization', testApp.authorization)
        .send({})
        .expect(201, {
          tokenCount: 1,
          sentCount: 0,
          failedCount: 1,
          failureReasons: [reason],
        });
      expect(log).toHaveBeenCalledWith('Push dispatch failed.');
      expect(JSON.stringify(log.mock.calls)).not.toContain(privateDetails);
      expect(JSON.stringify(log.mock.calls)).not.toContain(
        NOTIFICATIONS_TEST_TOKEN.pushToken,
      );
      if (deactivate) {
        expect(
          testApp.prisma.userPushToken.updateMany.mock.calls[0]?.[0],
        ).toMatchObject({
          data: { isActive: false },
          where: {
            deviceId: NOTIFICATIONS_TEST_TOKEN.deviceId,
            userId: NOTIFICATIONS_TEST_USER_ID,
          },
        });
      } else {
        expect(testApp.prisma.userPushToken.updateMany).not.toHaveBeenCalled();
      }
    },
  );

  it('does not stringify a non-string SDK code or use it for token cleanup', async () => {
    const stringify = jest.fn(() => {
      throw new Error(privateDetails);
    });
    send.mockRejectedValueOnce({
      code: { toString: stringify },
      message: privateDetails,
    });
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(201, {
        tokenCount: 1,
        sentCount: 0,
        failedCount: 1,
        failureReasons: ['Push delivery failed.'],
      });
    expect(stringify).not.toHaveBeenCalled();
    expect(testApp.prisma.userPushToken.updateMany).not.toHaveBeenCalled();
  });

  it('preserves successful delivery, deduplication and the counter payload', async () => {
    testApp.prisma.userPushToken.findMany.mockResolvedValueOnce([
      {
        deviceId: 'first-device',
        pushToken: NOTIFICATIONS_TEST_TOKEN.pushToken,
      },
      {
        deviceId: 'second-device',
        pushToken: NOTIFICATIONS_TEST_TOKEN.pushToken,
      },
    ]);
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(201, {
        tokenCount: 1,
        sentCount: 1,
        failedCount: 0,
        failureReasons: [],
      });
    expect(send).toHaveBeenCalledTimes(1);
    expect(testApp.prisma.userPushToken.updateMany).not.toHaveBeenCalled();
  });

  it('does not serialize credential-loading errors into startup warnings', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn');
    jest.mocked(getApps).mockImplementationOnce(() => {
      throw new Error(`${privateDetails} C:/credentials/private.json`);
    });
    const unavailableApp = await createNotificationsHttpApp();
    try {
      expect(warn).toHaveBeenCalledWith('Firebase Admin SDK is unavailable.');
      expect(JSON.stringify(warn.mock.calls)).not.toContain(privateDetails);
      expect(JSON.stringify(warn.mock.calls)).not.toContain('private.json');
    } finally {
      await unavailableApp.app.close();
    }
  });
});
