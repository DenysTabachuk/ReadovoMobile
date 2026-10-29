import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';

import { registerPushToken } from './registerPushToken';
import { dispatchLearningRemindersNow } from './dispatchLearningRemindersNow';

// Keep Axios serialization/parsing real; auth/session behavior has its own suites.
jest.mock('@/features/auth', () => ({
  api: jest.requireActual('@/api/httpClient').httpClient,
}));

const payload = {
  deviceId: 'test-device',
  platform: 'android',
  provider: 'fcm',
  pushToken: 'test-push-token',
} as const;

it('keeps registration void while consuming the backend JSON acknowledgement', async () => {
  const adapter = mockHttpAdapter().mockResolvedValue(
    createHttpResponse('{"ok":true}', { status: 201 }),
  );
  await expect(
    registerPushToken('reader-id', payload),
  ).resolves.toBeUndefined();
  expect(adapter.mock.calls[0][0].url).toBe(
    '/notifications/push-token/reader-id',
  );
  expect(adapter.mock.calls[0][0].data).toBe(JSON.stringify(payload));
});

it('retains the code in a JSON registration failure instead of treating the body as text', async () => {
  mockHttpAdapter().mockResolvedValue(
    createHttpResponse(
      '{"code":"AUTH_ACCESS_TOKEN_EXPIRED","message":"Changed wording"}',
      { status: 401 },
    ),
  );
  await expect(registerPushToken('reader-id', payload)).rejects.toMatchObject({
    status: 401,
    code: 'AUTH_ACCESS_TOKEN_EXPIRED',
  });
});

it('preserves the production restriction code for operation feedback', async () => {
  mockHttpAdapter().mockResolvedValue(
    createHttpResponse('{"code":"NOTIFICATIONS_MANUAL_DISPATCH_DISABLED"}', {
      status: 403,
    }),
  );
  await expect(dispatchLearningRemindersNow()).rejects.toMatchObject({
    status: 403,
    code: 'NOTIFICATIONS_MANUAL_DISPATCH_DISABLED',
  });
});
