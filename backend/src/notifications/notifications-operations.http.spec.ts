import request from 'supertest';

import {
  createNotificationsHttpApp,
  NOTIFICATIONS_TEST_TOKEN,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';

const dispatchPath = '/notifications/learning-reminders/dispatch';
const clearPath = `${dispatchPath}/today/me`;
const testPushPath = `/notifications/test-push/me`;

describe('Notification restricted operations and delivery outcomes (HTTP)', () => {
  let testApp: NotificationsHttpTestApp;
  let previousEnvironment: string | undefined;
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

  it('blocks manual dispatch in production with a domain 403', async () => {
    process.env.NODE_ENV = 'production';
    await request(testApp.server)
      .post(dispatchPath)
      .set('Authorization', testApp.authorization)
      .expect(403, {
        statusCode: 403,
        code: 'NOTIFICATIONS_MANUAL_DISPATCH_DISABLED',
        message: 'Manual reminder dispatch is disabled in production.',
      });
    expect(
      testApp.prisma.userNotificationPreference.findMany,
    ).not.toHaveBeenCalled();
  });

  it('blocks clearing dispatch records in production with a domain 403', async () => {
    process.env.NODE_ENV = 'production';
    await request(testApp.server)
      .delete(clearPath)
      .set('Authorization', testApp.authorization)
      .expect(403, {
        statusCode: 403,
        code: 'NOTIFICATIONS_DISPATCH_CLEAR_DISABLED',
        message: 'Clearing reminder dispatches is disabled in production.',
      });
    expect(
      testApp.prisma.userLearningReminderDispatch.deleteMany,
    ).not.toHaveBeenCalled();
  });

  it('keeps authenticated development dispatch successful with no eligible users', async () => {
    await request(testApp.server)
      .post(dispatchPath)
      .set('Authorization', testApp.authorization)
      .expect(201, {
        checkedCount: 0,
        sentCount: 0,
        skippedAlreadySentCount: 0,
        skippedCompletedTodayCount: 0,
        skippedNoTokensCount: 0,
        skippedOutsideWindowCount: 0,
        skippedSendFailedCount: 0,
      });
  });

  it('keeps development clearing successful with the existing deleted-count payload', async () => {
    await request(testApp.server)
      .delete(clearPath)
      .set('Authorization', testApp.authorization)
      .expect(200, { deletedCount: 2 });
  });

  it('keeps a no-token test push a successful delivery outcome', async () => {
    await request(testApp.server)
      .post(testPushPath)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(201, {
        tokenCount: 0,
        sentCount: 0,
        failedCount: 0,
        failureReasons: [],
      });
  });

  it('keeps unavailable Firebase a failed delivery result rather than a non-2xx error', async () => {
    testApp.prisma.userPushToken.findMany.mockResolvedValueOnce([
      {
        deviceId: NOTIFICATIONS_TEST_TOKEN.deviceId,
        pushToken: NOTIFICATIONS_TEST_TOKEN.pushToken,
      },
    ]);
    await request(testApp.server)
      .post(testPushPath)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(201, {
        tokenCount: 1,
        sentCount: 0,
        failedCount: 1,
        failureReasons: ['Firebase Admin SDK is not configured.'],
      });
    expect(testApp.prisma.userPushToken.updateMany).not.toHaveBeenCalled();
  });

  it('hides a failed eligible-user query during manual dispatch', async () => {
    testApp.prisma.userNotificationPreference.findMany.mockRejectedValueOnce(
      new Error('private persistence diagnostics'),
    );
    await request(testApp.server)
      .post(dispatchPath)
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });

  it('hides a failed dispatch-record deletion', async () => {
    testApp.prisma.userLearningReminderDispatch.deleteMany.mockRejectedValueOnce(
      new Error('private persistence diagnostics'),
    );
    await request(testApp.server)
      .delete(clearPath)
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });

  it('hides a failed token query for a test push', async () => {
    testApp.prisma.userPushToken.findMany.mockRejectedValueOnce(
      new Error('private persistence diagnostics'),
    );
    await request(testApp.server)
      .post(testPushPath)
      .set('Authorization', testApp.authorization)
      .send({})
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });

  it('validates test-push content before reading tokens', async () => {
    const response = await request(testApp.server)
      .post(testPushPath)
      .set('Authorization', testApp.authorization)
      .send({ title: 42 })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.prisma.userPushToken.findMany).not.toHaveBeenCalled();
  });
});
