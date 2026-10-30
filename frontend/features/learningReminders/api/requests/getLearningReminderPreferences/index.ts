import { api } from '@/features/auth';

import type { LearningReminderPreferencesResponse } from '../../types';

export async function getLearningReminderPreferences(): Promise<LearningReminderPreferencesResponse> {
  const response = await api.get<LearningReminderPreferencesResponse>(
    `/notifications/preferences/me`,
  );

  return response.data;
}
