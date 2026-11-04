import { api } from '@/features/auth';

import type { LearningReminderPreferencesResponse } from '@/api/generated/transport';

export async function getLearningReminderPreferences(): Promise<LearningReminderPreferencesResponse> {
  const response = await api.get<LearningReminderPreferencesResponse>(
    `/notifications/preferences/me`,
  );

  return response.data;
}
