import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { SendRemoteTestPushResponse } from '../types';
import { logFailedResponse } from '../utils/logFailedResponse';

export async function sendRemoteTestPush(
  userId: string,
): Promise<SendRemoteTestPushResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/test-push/${userId}`,
    {
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    await logFailedResponse('sendRemoteTestPush', response);
    throw new Error('settings.learningReminders.remoteTestFailed');
  }

  return response.json() as Promise<SendRemoteTestPushResponse>;
}
