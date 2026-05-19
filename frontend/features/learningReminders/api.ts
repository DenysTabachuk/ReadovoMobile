import { authenticatedFetch } from '@/api/auth/authenticatedFetch';
import { API_BASE_URL } from '@/api/auth/constants';

import type { LearningReminderTime } from '@/providers/preferencesProvider';

type LearningReminderPreferencesResponse = {
  learningReminderTime: LearningReminderTime;
  learningRemindersEnabled: boolean;
};

type RegisterPushTokenPayload = {
  deviceId: string;
  expoPushToken: string;
  platform: 'android' | 'ios';
};

export async function getLearningReminderPreferences(
  userId: string,
): Promise<LearningReminderPreferencesResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/preferences/${userId}`);

  if (!response.ok) {
    throw new Error('settings.learningReminders.fetchFailed');
  }

  return response.json() as Promise<LearningReminderPreferencesResponse>;
}

export async function updateLearningReminderPreferences(
  userId: string,
  payload: LearningReminderPreferencesResponse,
): Promise<LearningReminderPreferencesResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/preferences/${userId}`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('settings.learningReminders.updateFailed');
  }

  return response.json() as Promise<LearningReminderPreferencesResponse>;
}

export async function registerPushToken(
  userId: string,
  payload: RegisterPushTokenPayload,
): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/push-token/${userId}`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('settings.learningReminders.registerTokenFailed');
  }
}

export async function sendRemoteTestPush(userId: string): Promise<{ sentCount: number }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/notifications/test-push/${userId}`, {
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('settings.learningReminders.remoteTestFailed');
  }

  return response.json() as Promise<{ sentCount: number }>;
}
