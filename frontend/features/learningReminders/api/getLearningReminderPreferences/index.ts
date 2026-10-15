import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { LearningReminderPreferencesResponse } from '../types';
import { logFailedResponse } from '../utils/logFailedResponse';

export async function getLearningReminderPreferences(
  userId: string,
): Promise<LearningReminderPreferencesResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/preferences/${userId}`,
  );

  if (!response.ok) {
    await logFailedResponse('getLearningReminderPreferences', response);
    throw new Error('settings.learningReminders.fetchFailed');
  }

  return response.json() as Promise<LearningReminderPreferencesResponse>;
}
