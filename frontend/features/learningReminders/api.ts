import { authenticatedFetch } from '@/api/auth/authenticatedFetch';
import { API_BASE_URL } from '@/api/auth/constants';

import type { LearningReminderTime } from '@/providers/preferencesProvider';

type LearningReminderPreferencesResponse = {
  learningReminderTime: LearningReminderTime;
  learningRemindersEnabled: boolean;
};

type RegisterPushTokenPayload = {
  deviceId: string;
  pushToken: string;
  platform: 'android' | 'ios';
  provider: 'fcm';
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

type SendRemoteTestPushResponse = {
  failedCount: number;
  failureReasons: string[];
  sentCount: number;
  tokenCount: number;
};

type LearningReminderDispatchResponse = {
  checkedCount: number;
  skippedAlreadySentCount: number;
  skippedCompletedTodayCount: number;
  skippedNoTokensCount: number;
  skippedOutsideWindowCount: number;
  skippedSendFailedCount: number;
  sentCount: number;
};

export async function sendRemoteTestPush(
  userId: string,
): Promise<SendRemoteTestPushResponse> {
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

  return response.json() as Promise<SendRemoteTestPushResponse>;
}

export async function dispatchLearningRemindersNow(): Promise<LearningReminderDispatchResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/learning-reminders/dispatch`,
    {
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('settings.learningReminders.dispatchFailed');
  }

  return response.json() as Promise<LearningReminderDispatchResponse>;
}

export async function clearTodayLearningReminderDispatch(
  userId: string,
): Promise<{ deletedCount: number }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/notifications/learning-reminders/dispatch/today/${userId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error('settings.learningReminders.clearDispatchFailed');
  }

  return response.json() as Promise<{ deletedCount: number }>;
}
