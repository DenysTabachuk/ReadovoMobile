import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { LearningReminderDispatchResponse } from '../types';
import { logFailedResponse } from '../utils/logFailedResponse';

export async function dispatchLearningRemindersNow(): Promise<LearningReminderDispatchResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/learning-reminders/dispatch`,
    {
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    await logFailedResponse('dispatchLearningRemindersNow', response);
    throw new Error('settings.learningReminders.dispatchFailed');
  }

  return response.json() as Promise<LearningReminderDispatchResponse>;
}
