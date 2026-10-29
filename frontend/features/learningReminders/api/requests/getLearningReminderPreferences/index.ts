import { api } from '@/features/auth';

import type { LearningReminderPreferencesResponse } from '../../types';

export async function getLearningReminderPreferences(
  userId: string,
): Promise<LearningReminderPreferencesResponse> {
  const response = await api.get<LearningReminderPreferencesResponse>(
    `/notifications/preferences/${userId}`,
  );

  return response.data;
}
