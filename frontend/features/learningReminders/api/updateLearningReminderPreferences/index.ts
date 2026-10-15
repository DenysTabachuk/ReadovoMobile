import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { LearningReminderPreferencesResponse } from '../types';
import { logFailedResponse } from '../utils/logFailedResponse';

export async function updateLearningReminderPreferences(
  userId: string,
  payload: LearningReminderPreferencesResponse,
): Promise<LearningReminderPreferencesResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/preferences/${userId}`,
    {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    },
  );

  if (!response.ok) {
    await logFailedResponse('updateLearningReminderPreferences', response);
    throw new Error('settings.learningReminders.updateFailed');
  }

  return response.json() as Promise<LearningReminderPreferencesResponse>;
}
