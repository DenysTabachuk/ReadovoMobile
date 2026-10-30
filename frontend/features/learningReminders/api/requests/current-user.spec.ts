import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { getLearningReminderPreferences } from './getLearningReminderPreferences';
import { updateLearningReminderPreferences } from './updateLearningReminderPreferences';
import { sendRemoteTestPush } from './sendRemoteTestPush';
import { clearTodayLearningReminderDispatch } from './clearTodayLearningReminderDispatch';

jest.mock('@/features/auth', () => ({
  api: jest.requireActual('@/api/httpClient').httpClient,
}));

it('getLearningReminderPreferences sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await getLearningReminderPreferences();
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/notifications/preferences/me',
    method: 'get',
  });
});

it('updateLearningReminderPreferences sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await updateLearningReminderPreferences({
    learningRemindersEnabled: true,
    learningReminderTime: '19:00',
  });
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/notifications/preferences/me',
    method: 'put',
  });
  expect(adapter.mock.calls[0][0].data).toBe(
    JSON.stringify({
      learningRemindersEnabled: true,
      learningReminderTime: '19:00',
    }),
  );
});

it('sendRemoteTestPush sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await sendRemoteTestPush();
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/notifications/test-push/me',
    method: 'post',
  });
});

it('clearTodayLearningReminderDispatch sends only resource data to the current-user route', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(createHttpResponse('{}'));
  await clearTodayLearningReminderDispatch();
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/notifications/learning-reminders/dispatch/today/me',
    method: 'delete',
  });
});
