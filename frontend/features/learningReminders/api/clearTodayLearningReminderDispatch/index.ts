import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import { logFailedResponse } from '../utils/logFailedResponse';

export async function clearTodayLearningReminderDispatch(
  userId: string,
): Promise<{ deletedCount: number }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/learning-reminders/dispatch/today/${userId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    await logFailedResponse('clearTodayLearningReminderDispatch', response);
    throw new Error('settings.learningReminders.clearDispatchFailed');
  }

  return response.json() as Promise<{ deletedCount: number }>;
}
