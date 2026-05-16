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
  expoPushToken: string;
  platform: 'android' | 'ios';
};

export type SendTestPushDto = {
  body?: string;
  title?: string;
};
