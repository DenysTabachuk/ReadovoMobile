import { api } from '@/features/auth';

import type {
  LearningReminderPreferencesResponse,
  UpdateLearningReminderPreferencesRequest,
} from '@/api/generated/transport';

export async function updateLearningReminderPreferences(
  payload: UpdateLearningReminderPreferencesRequest,
): Promise<LearningReminderPreferencesResponse> {
  const response = await api.put<LearningReminderPreferencesResponse>(
    `/notifications/preferences/me`,
    payload,
  );

  return response.data;
}
