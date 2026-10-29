import { api } from '@/features/auth';

export async function clearTodayLearningReminderDispatch(
  userId: string,
): Promise<{ deletedCount: number }> {
  const response = await api.delete<{ deletedCount: number }>(
    `/notifications/learning-reminders/dispatch/today/${userId}`,
  );

  return response.data;
}
