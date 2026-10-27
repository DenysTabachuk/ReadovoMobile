import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { RegisterPushTokenPayload } from '../../types';

export async function registerPushToken(
  userId: string,
  payload: RegisterPushTokenPayload,
): Promise<void> {
  await api
    .post(`/notifications/push-token/${userId}`, payload, {
      responseType: 'text',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .catch(mapHttpError('settings.learningReminders.registerTokenFailed'));
}
