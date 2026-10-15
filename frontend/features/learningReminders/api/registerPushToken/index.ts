import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { RegisterPushTokenPayload } from '../types';
import { logFailedResponse } from '../utils/logFailedResponse';

export async function registerPushToken(
  userId: string,
  payload: RegisterPushTokenPayload,
): Promise<void> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/push-token/${userId}`,
    {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    await logFailedResponse('registerPushToken', response);
    throw new Error('settings.learningReminders.registerTokenFailed');
  }
}
