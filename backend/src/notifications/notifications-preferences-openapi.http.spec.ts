import request, { type Response } from 'supertest';

import { exportOpenApi } from '../openapi/export-openapi';
import {
  createNotificationsHttpApp,
  type NotificationsHttpTestApp,
} from './testing/create-notifications-http-app';
import { createNotificationsResponseAssertion } from './testing/create-notifications-response-assertion';

const path = '/notifications/preferences/me';

describe('Notification preferences OpenAPI wire contract (HTTP)', () => {
  let testApp: NotificationsHttpTestApp;
  let assertResponse: Awaited<
    ReturnType<typeof createNotificationsResponseAssertion>
  >;
  beforeAll(async () => {
    assertResponse = await createNotificationsResponseAssertion();
  });
  beforeEach(async () => {
    testApp = await createNotificationsHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('returns required stored preferences with HTTP 200', async () => {
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(200, {
        learningReminderTime: '19:00',
        learningRemindersEnabled: false,
      })
      .expect((response: Response) =>
        assertResponse('getLearningReminderPreferences', response),
      );
  });

  it.each([
    { learningRemindersEnabled: true },
    { learningRemindersEnabled: true, learningReminderTime: null },
  ])('uses the server default for omitted/null time: %j', async (body) => {
    testApp.prisma.userNotificationPreference.findUniqueOrThrow.mockResolvedValue(
      { learningReminderTime: '19:00', learningRemindersEnabled: true },
    );
    await request(testApp.server)
      .put(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(200, {
        learningReminderTime: '19:00',
        learningRemindersEnabled: true,
      })
      .expect((response: Response) =>
        assertResponse('updateLearningReminderPreferences', response),
      );
    expect(
      testApp.prisma.userNotificationPreference.upsert.mock.calls[0]?.[0],
    ).toMatchObject({
      create: { learningReminderTime: '19:00' },
      update: { learningReminderTime: '19:00' },
    });
  });

  it('trims HH:mm input before persistence and keeps string output', async () => {
    testApp.prisma.userNotificationPreference.findUniqueOrThrow.mockResolvedValue(
      { learningReminderTime: '07:05', learningRemindersEnabled: true },
    );
    await request(testApp.server)
      .put(path)
      .set('Authorization', testApp.authorization)
      .send({ learningRemindersEnabled: true, learningReminderTime: ' 07:05 ' })
      .expect(200, {
        learningReminderTime: '07:05',
        learningRemindersEnabled: true,
      })
      .expect((response: Response) =>
        assertResponse('updateLearningReminderPreferences', response),
      );
    expect(
      testApp.prisma.userNotificationPreference.upsert.mock.calls[0]?.[0],
    ).toMatchObject({ update: { learningReminderTime: '07:05' } });
  });

  it.each([
    {},
    { learningRemindersEnabled: 'true' },
    { learningRemindersEnabled: true, learningReminderTime: '24:00' },
    { learningRemindersEnabled: true, learningReminderTime: '19:60' },
    { learningRemindersEnabled: true, userId: 'untrusted-owner' },
  ])('documents validation before persistence for %j', async (body) => {
    const response = await request(testApp.server)
      .put(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(400)
      .expect((response: Response) =>
        assertResponse('updateLearningReminderPreferences', response),
      );
    expect(response.body).toHaveProperty('code', 'VALIDATION_FAILED');
    expect(
      testApp.prisma.userNotificationPreference.upsert,
    ).not.toHaveBeenCalled();
  });

  it('documents nullable optional input independently of required output fields', async () => {
    const document = await exportOpenApi();
    expect(document.components?.schemas).toMatchObject({
      UpdateLearningReminderPreferencesRequest: {
        additionalProperties: false,
        required: ['learningRemindersEnabled'],
        properties: {
          learningReminderTime: {
            type: 'string',
            nullable: true,
            default: '19:00',
            pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
          },
        },
      },
      LearningReminderPreferencesResponse: {
        required: ['learningReminderTime', 'learningRemindersEnabled'],
        properties: {
          learningReminderTime: { type: 'string' },
          learningRemindersEnabled: { type: 'boolean' },
        },
      },
    });
  });
});
