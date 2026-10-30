import request from 'supertest';

import {
  createNotificationsHttpApp,
  NOTIFICATIONS_TEST_USER_ID,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';

const path = `/notifications/preferences/me`;

describe('Notification preferences (HTTP)', () => {
  let testApp: NotificationsHttpTestApp;
  beforeEach(async () => {
    testApp = await createNotificationsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('keeps the existing preferences payload and lazy default row', async () => {
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(200, {
        learningReminderTime: '19:00',
        learningRemindersEnabled: false,
      });
    expect(
      testApp.prisma.userNotificationPreference.upsert,
    ).toHaveBeenCalledWith({
      create: { userId: NOTIFICATIONS_TEST_USER_ID },
      update: {},
      where: { userId: NOTIFICATIONS_TEST_USER_ID },
    });
  });

  it('keeps the default time when updating only the enabled flag', async () => {
    testApp.prisma.userNotificationPreference.findUniqueOrThrow.mockResolvedValueOnce(
      { learningReminderTime: '19:00', learningRemindersEnabled: true },
    );
    await request(testApp.server)
      .put(path)
      .set('Authorization', testApp.authorization)
      .send({ learningRemindersEnabled: true })
      .expect(200, {
        learningReminderTime: '19:00',
        learningRemindersEnabled: true,
      });
    expect(
      testApp.prisma.userNotificationPreference.upsert.mock.calls[0]?.[0],
    ).toMatchObject({
      create: {
        userId: NOTIFICATIONS_TEST_USER_ID,
        learningReminderTime: '19:00',
        learningRemindersEnabled: true,
      },
    });
  });

  it.each([
    { learningRemindersEnabled: 'yes' },
    { learningRemindersEnabled: true, learningReminderTime: '24:00' },
    { learningRemindersEnabled: true, learningReminderTime: '19:60' },
  ])('validates preferences %# before persistence', async (body) => {
    const response = await request(testApp.server)
      .put(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(
      testApp.prisma.userNotificationPreference.upsert,
    ).not.toHaveBeenCalled();
  });

  it.each(['get', 'put'] as const)(
    'hides persistence errors on %s',
    async (method) => {
      testApp.prisma.userNotificationPreference.upsert.mockRejectedValueOnce(
        new Error('private database diagnostics'),
      );
      await request(testApp.server)
        [method](path)
        .set('Authorization', testApp.authorization)
        .send(method === 'put' ? { learningRemindersEnabled: true } : {})
        .expect(500, {
          statusCode: 500,
          code: 'INTERNAL_ERROR',
          message: 'Internal server error.',
        });
    },
  );
});
