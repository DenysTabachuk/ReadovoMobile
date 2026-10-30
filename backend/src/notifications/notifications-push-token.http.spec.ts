import { Logger } from '@nestjs/common';
import request from 'supertest';

import {
  createNotificationsHttpApp,
  NOTIFICATIONS_TEST_TOKEN,
  NOTIFICATIONS_TEST_USER_ID,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';

const path = `/notifications/push-token/me`;

describe('Notification push-token requests (HTTP)', () => {
  let testApp: NotificationsHttpTestApp;
  beforeEach(async () => {
    testApp = await createNotificationsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
    jest.restoreAllMocks();
  });

  it('keeps registration successful and deactivates another owner of the token', async () => {
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(NOTIFICATIONS_TEST_TOKEN)
      .expect(201, { ok: true });
    expect(
      testApp.prisma.userPushToken.updateMany.mock.calls[0]?.[0],
    ).toMatchObject({
      data: { isActive: false, pushToken: null },
      where: {
        pushToken: NOTIFICATIONS_TEST_TOKEN.pushToken,
        userId: { not: NOTIFICATIONS_TEST_USER_ID },
      },
    });
    expect(
      testApp.prisma.userPushToken.upsert.mock.calls[0]?.[0],
    ).toMatchObject({
      create: {
        ...NOTIFICATIONS_TEST_TOKEN,
        userId: NOTIFICATIONS_TEST_USER_ID,
        isActive: true,
      },
    });
  });

  it('keeps deactivation idempotent for an unknown device', async () => {
    await request(testApp.server)
      .delete(path)
      .query({ deviceId: 'unknown-device' })
      .set('Authorization', testApp.authorization)
      .expect(200, { ok: true });
    expect(
      testApp.prisma.userPushToken.updateMany.mock.calls[0]?.[0],
    ).toMatchObject({
      data: { isActive: false },
      where: { deviceId: 'unknown-device', userId: NOTIFICATIONS_TEST_USER_ID },
    });
  });

  it.each([
    { ...NOTIFICATIONS_TEST_TOKEN, pushToken: 'short' },
    { ...NOTIFICATIONS_TEST_TOKEN, deviceId: ' ' },
    { ...NOTIFICATIONS_TEST_TOKEN, provider: 'invalid' },
  ])('validates registration %# before persistence', async (body) => {
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.prisma.userPushToken.updateMany).not.toHaveBeenCalled();
    expect(testApp.prisma.userPushToken.upsert).not.toHaveBeenCalled();
  });

  it('requires a device ID for deactivation', async () => {
    const response = await request(testApp.server)
      .delete(path)
      .set('Authorization', testApp.authorization)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.prisma.userPushToken.updateMany).not.toHaveBeenCalled();
  });

  it('does not expose or log a token contained in a persistence error', async () => {
    const log = jest.spyOn(Logger.prototype, 'error');
    testApp.prisma.userPushToken.upsert.mockRejectedValueOnce(
      new Error(`DB failure ${NOTIFICATIONS_TEST_TOKEN.pushToken}`),
    );
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(NOTIFICATIONS_TEST_TOKEN)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
    expect(log).toHaveBeenCalledWith('Push token registration failed.');
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      NOTIFICATIONS_TEST_TOKEN.pushToken,
    );
  });
});
