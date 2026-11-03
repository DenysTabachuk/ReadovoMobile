export const DEFAULT_LEARNING_REMINDER_TIME = '19:00';
export const LEARNING_REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const PUSH_DEVICE_ID_MAX_LENGTH = 256;
export const PUSH_TOKEN_MIN_LENGTH = 32;
export const PUSH_TOKEN_MAX_LENGTH = 4_096;
export const PUSH_PLATFORMS = ['android'] as const;
export const PUSH_PROVIDERS = ['fcm'] as const;
