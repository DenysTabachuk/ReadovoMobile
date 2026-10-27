import { type HttpError } from '@/api/httpError';
type ErrorResponseBody = {
  message?: string | string[];
};

// TODO: Resolve stable backend error codes instead of message text. See docs/mascot-error-codes.md.
/**
 * Translate recognized mascot API errors into UI message keys.
 *
 * Maps parsed error data; unknown shapes fall back to the supplied translation key.
 *
 * @param response - Axios response carrying parsed error data or plain error text.
 * @param fallbackKey - Translation key to return for an unknown or unreadable error.
 * @returns The recognized error key, or fallbackKey. For message arrays, only the first
 *   message is checked.
 * @example
 * await resolveMascotErrorMessage(response, 'mascot.errors.generic');
 * // => 'mascot.errors.notEnoughCoins'
 */
export async function resolveMascotErrorMessage(
  response: HttpError['response'],
  fallbackKey: string,
): Promise<string> {
  if (!response.data || typeof response.data !== 'object') return fallbackKey;
  const body = response.data as ErrorResponseBody;
  const rawMessage = Array.isArray(body.message)
    ? body.message[0]
    : body.message;

  if (rawMessage === 'Not enough coins.') {
    return 'mascot.errors.notEnoughCoins';
  }

  if (rawMessage === 'Mascot item is not owned.') {
    return 'mascot.errors.itemNotOwned';
  }

  return fallbackKey;
}
