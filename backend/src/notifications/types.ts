export type LearningReminderPreferences = {
  learningReminderTime: string;
  learningRemindersEnabled: boolean;
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
