import { api } from '@/features/auth';

export async function clearTodayLearningReminderDispatch(): Promise<{
  deletedCount: number;
}> {
  const response = await api.delete<{ deletedCount: number }>(
    `/notifications/learning-reminders/dispatch/today/me`,
  );

  return response.data;
}
