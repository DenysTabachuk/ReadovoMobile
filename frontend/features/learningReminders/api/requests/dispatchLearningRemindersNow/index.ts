import { api } from '@/features/auth';

import type { LearningReminderDispatchResponse } from '../../types';

export async function dispatchLearningRemindersNow(): Promise<LearningReminderDispatchResponse> {
  const response = await api.post<LearningReminderDispatchResponse>(
    `/notifications/learning-reminders/dispatch`,
    {},
  );

  return response.data;
}
