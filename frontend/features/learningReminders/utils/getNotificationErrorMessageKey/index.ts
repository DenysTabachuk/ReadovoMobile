import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

const ERROR_MESSAGES = new Map([
  [
    'NOTIFICATIONS_MANUAL_DISPATCH_DISABLED',
    {
      status: 403,
      messageKey: 'settings.learningReminders.manualDispatchDisabled',
    },
  ],
  [
    'NOTIFICATIONS_DISPATCH_CLEAR_DISABLED',
    {
      status: 403,
      messageKey: 'settings.learningReminders.clearDispatchDisabled',
    },
  ],
]);
/**
 * Selects localized learningReminders feedback from explicit API codes.
 * @param error - Request failure; backend message text is ignored.
 * @param fallbackKey - Optional override; unknown failures default to errors.generic.
 * @returns A translation key, or null for cancellation. Status mismatches fall back.
 * @example
 * getNotificationErrorMessageKey(new Error('private diagnostics')); // => 'errors.generic'
 */
export function getNotificationErrorMessageKey(
  error: unknown,
  fallbackKey?: string,
): string | null {
  return getApiErrorMessageKey(error, { fallbackKey, codes: ERROR_MESSAGES });
}
