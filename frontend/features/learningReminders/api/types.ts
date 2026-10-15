import type { LearningReminderTime } from '@/providers/preferencesProvider';

export type LearningReminderPreferencesResponse = {
  learningReminderTime: LearningReminderTime;
  learningRemindersEnabled: boolean;
};

export type RegisterPushTokenPayload = {
  deviceId: string;
  pushToken: string;
  platform: 'android' | 'ios';
  provider: 'fcm';
};

export type SendRemoteTestPushResponse = {
  failedCount: number;
  failureReasons: string[];
  sentCount: number;
  tokenCount: number;
};

export type LearningReminderDispatchResponse = {
  checkedCount: number;
  skippedAlreadySentCount: number;
  skippedCompletedTodayCount: number;
  skippedNoTokensCount: number;
  skippedOutsideWindowCount: number;
  skippedSendFailedCount: number;
  sentCount: number;
};
