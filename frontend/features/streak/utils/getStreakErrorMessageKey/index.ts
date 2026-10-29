import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

const ERROR_MESSAGES = new Map([
  [
    'STREAK_NOT_ENOUGH_COINS',
    { status: 400, messageKey: 'streak.errors.notEnoughCoins' },
  ],
  [
    'STREAK_FREEZE_TOKEN_LIMIT_REACHED',
    { status: 400, messageKey: 'streak.errors.freezeLimitReached' },
  ],
  [
    'STREAK_FREEZE_DAY_LIMIT_REACHED',
    { status: 400, messageKey: 'streak.errors.freezeDayLimitReached' },
  ],
  [
    'STREAK_NO_FREEZE_TOKENS',
    { status: 400, messageKey: 'streak.errors.noFreezeTokens' },
  ],
  [
    'STREAK_FREEZE_ONLY_MISSED_DAY',
    { status: 400, messageKey: 'streak.errors.freezeOnlyMissed' },
  ],
  [
    'STREAK_DAY_ALREADY_PROTECTED',
    { status: 400, messageKey: 'streak.errors.dayAlreadyProtected' },
  ],
  [
    'STREAK_RESTORE_UNAVAILABLE',
    { status: 400, messageKey: 'streak.errors.restoreUnavailable' },
  ],
  [
    'STREAK_CALENDAR_MONTH_UNAVAILABLE',
    { status: 400, messageKey: 'streak.errors.calendarUnavailable' },
  ],
  [
    'STREAK_RESTORE_PRICE_INVALID',
    { status: 400, messageKey: 'streak.errors.priceChanged' },
  ],
  [
    'STREAK_FREEZE_TOKEN_PRICE_INVALID',
    { status: 400, messageKey: 'streak.errors.priceChanged' },
  ],
]);
/**
 * Selects localized streak feedback from explicit API codes.
 * @param error - Request failure; backend message text is ignored.
 * @param fallbackKey - Optional override; unknown failures default to errors.generic.
 * @returns A translation key, or null for cancellation. Status mismatches fall back.
 * @example
 * getStreakErrorMessageKey(new Error('private diagnostics')); // => 'errors.generic'
 */
export function getStreakErrorMessageKey(
  error: unknown,
  fallbackKey?: string,
): string | null {
  return getApiErrorMessageKey(error, { fallbackKey, codes: ERROR_MESSAGES });
}
