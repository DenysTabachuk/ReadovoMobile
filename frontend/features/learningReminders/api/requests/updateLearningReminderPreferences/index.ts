import { api } from '@/features/auth';

import type { LearningReminderPreferencesResponse } from '../../types';

export async function updateLearningReminderPreferences(
  userId: string,
  payload: LearningReminderPreferencesResponse,
): Promise<LearningReminderPreferencesResponse> {
  const response = await api.put<LearningReminderPreferencesResponse>(
    `/notifications/preferences/${userId}`,
    payload,
  );

  return response.data;
}
