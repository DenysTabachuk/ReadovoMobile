import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

/** Streak owns these public codes, HTTP statuses and safe diagnostic messages. */
export const STREAK_ERRORS = {
  CALENDAR_MONTH_UNAVAILABLE: {
    code: 'STREAK_CALENDAR_MONTH_UNAVAILABLE',
    statusCode: 400,
    message: 'Future months are not available.',
  },
  RESTORE_PRICE_INVALID: {
    code: 'STREAK_RESTORE_PRICE_INVALID',
    statusCode: 400,
    message: 'Invalid restore price.',
  },
  RESTORE_UNAVAILABLE: {
    code: 'STREAK_RESTORE_UNAVAILABLE',
    statusCode: 400,
    message: 'Restore is not available.',
  },
  NOT_ENOUGH_COINS: {
    code: 'STREAK_NOT_ENOUGH_COINS',
    statusCode: 400,
    message: 'Not enough coins.',
  },
  NO_FREEZE_TOKENS: {
    code: 'STREAK_NO_FREEZE_TOKENS',
    statusCode: 400,
    message: 'No freeze tokens available.',
  },
  DAY_ALREADY_PROTECTED: {
    code: 'STREAK_DAY_ALREADY_PROTECTED',
    statusCode: 400,
    message: 'This day is already protected.',
  },
  FREEZE_ONLY_MISSED_DAY: {
    code: 'STREAK_FREEZE_ONLY_MISSED_DAY',
    statusCode: 400,
    message: 'Freeze can only be applied to a missed day.',
  },
  FREEZE_DAY_LIMIT_REACHED: {
    code: 'STREAK_FREEZE_DAY_LIMIT_REACHED',
    statusCode: 400,
    message: 'Freeze day limit reached.',
  },
  FREEZE_TOKEN_PRICE_INVALID: {
    code: 'STREAK_FREEZE_TOKEN_PRICE_INVALID',
    statusCode: 400,
    message: 'Invalid freeze token price.',
  },
  FREEZE_TOKEN_LIMIT_REACHED: {
    code: 'STREAK_FREEZE_TOKEN_LIMIT_REACHED',
    statusCode: 400,
    message: 'Freeze token limit reached.',
  },
  USER_NOT_FOUND: {
    code: 'STREAK_USER_NOT_FOUND',
    statusCode: 404,
    message: 'User not found.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
