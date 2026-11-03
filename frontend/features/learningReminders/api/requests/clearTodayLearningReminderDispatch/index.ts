import { api } from '@/features/auth';
import type { ClearTodayLearningReminderDispatchResponse } from '@/api/generated/transport';

export async function clearTodayLearningReminderDispatch(): Promise<ClearTodayLearningReminderDispatchResponse> {
  const response = await api.delete<ClearTodayLearningReminderDispatchResponse>(
    `/notifications/learning-reminders/dispatch/today/me`,
  );

  return response.data;
}
