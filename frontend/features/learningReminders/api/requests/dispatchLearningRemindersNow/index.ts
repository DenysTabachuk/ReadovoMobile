import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { LearningReminderDispatchResponse } from '../../types';

export async function dispatchLearningRemindersNow(): Promise<LearningReminderDispatchResponse> {
  const response = await api
    .post<LearningReminderDispatchResponse>(
      `/notifications/learning-reminders/dispatch`,
      {},
    )
    .catch(mapHttpError('settings.learningReminders.dispatchFailed'));

  return response.data;
}
