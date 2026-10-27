import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

export async function clearTodayLearningReminderDispatch(
  userId: string,
): Promise<{ deletedCount: number }> {
  const response = await api
    .delete<{ deletedCount: number }>(
      `/notifications/learning-reminders/dispatch/today/${userId}`,
    )
    .catch(mapHttpError('settings.learningReminders.clearDispatchFailed'));

  return response.data;
}
