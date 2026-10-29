import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

const ERROR_MESSAGES = new Map([
  [
    'MASCOT_NOT_ENOUGH_COINS',
    { status: 400, messageKey: 'mascot.errors.notEnoughCoins' },
  ],
  [
    'MASCOT_ITEM_NOT_OWNED',
    { status: 400, messageKey: 'mascot.errors.itemNotOwned' },
  ],
  [
    'MASCOT_ITEM_UNKNOWN',
    { status: 400, messageKey: 'mascot.errors.itemUnknown' },
  ],
]);
/**
 * Selects localized mascot feedback from explicit API codes.
 * @param error - Request failure; backend message text is ignored.
 * @param fallbackKey - Optional override; unknown failures default to errors.generic.
 * @returns A translation key, or null for cancellation. Status mismatches fall back.
 * @example
 * getMascotErrorMessageKey(new Error('private diagnostics')); // => 'errors.generic'
 */
export function getMascotErrorMessageKey(
  error: unknown,
  fallbackKey?: string,
): string | null {
  return getApiErrorMessageKey(error, { fallbackKey, codes: ERROR_MESSAGES });
}
