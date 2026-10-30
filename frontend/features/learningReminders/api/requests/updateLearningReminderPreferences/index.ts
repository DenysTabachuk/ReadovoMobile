import { api } from '@/features/auth';

import type { LearningReminderPreferencesResponse } from '../../types';

export async function updateLearningReminderPreferences(
  payload: LearningReminderPreferencesResponse,
): Promise<LearningReminderPreferencesResponse> {
  const response = await api.put<LearningReminderPreferencesResponse>(
    `/notifications/preferences/me`,
    payload,
  );

  return response.data;
}
