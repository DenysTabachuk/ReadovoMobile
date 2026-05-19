export type LearningReminderPreferences = {
  learningReminderTime: string;
  learningRemindersEnabled: boolean;
};

export type UpsertLearningReminderPreferencesDto = {
  learningReminderTime?: string;
  learningRemindersEnabled: boolean;
};

export type RegisterPushTokenDto = {
  deviceId: string;
  pushToken: string;
  platform: 'android' | 'ios';
  provider: 'fcm';
};

export type SendTestPushDto = {
  body?: string;
  title?: string;
};

export type SendTestPushResult = {
  failedCount: number;
  failureReasons: string[];
  sentCount: number;
  tokenCount: number;
};

export type LearningReminderDispatchResult = {
  checkedCount: number;
  skippedAlreadySentCount: number;
  skippedCompletedTodayCount: number;
  skippedNoTokensCount: number;
  skippedOutsideWindowCount: number;
  skippedSendFailedCount: number;
  sentCount: number;
};
