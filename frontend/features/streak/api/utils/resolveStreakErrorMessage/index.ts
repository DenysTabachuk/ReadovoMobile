type ErrorResponseBody = {
  message?: string | string[];
};

// TODO: Map stable backend error codes instead of message text. See docs/api-error-codes.md.
const ERROR_MESSAGE_KEYS = new Map<string, string>([
  ['Not enough coins.', 'streak.errors.notEnoughCoins'],
  ['Freeze token limit reached.', 'streak.errors.freezeLimitReached'],
  ['Freeze day limit reached.', 'streak.errors.freezeDayLimitReached'],
  ['No freeze tokens available.', 'streak.errors.noFreezeTokens'],
  [
    'Freeze is only available for recently missed days.',
    'streak.errors.freezeWindowExpired',
  ],
  [
    'Freeze is only available for the last 3 missed days.',
    'streak.errors.freezeWindowExpired',
  ],
  [
    'Freeze can only be applied to a missed day.',
    'streak.errors.freezeOnlyMissed',
  ],
  ['This day is already protected.', 'streak.errors.dayAlreadyProtected'],
]);

/**
 * Translate recognized streak API errors into UI message keys.
 *
 * Consumes the response body. Both supported server messages for an expired freeze window
 * map to the same key.
 *
 * @param response - Error response with an unread JSON body.
 * @param fallbackKey - Translation key for unknown or unreadable errors.
 * @returns The recognized streak error key, or fallbackKey. For message arrays, only the
 *   first entry is checked.
 * @example
 * await resolveStreakErrorMessage(new Response(JSON.stringify({ message: 'No freeze tokens available.' })), 'streak.errors.generic');
 * // => 'streak.errors.noFreezeTokens'
 */
export async function resolveStreakErrorMessage(
  response: Response,
  fallbackKey: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponseBody;
    const rawMessage = Array.isArray(body.message)
      ? body.message[0]
      : body.message;

    return typeof rawMessage === 'string'
      ? (ERROR_MESSAGE_KEYS.get(rawMessage) ?? fallbackKey)
      : fallbackKey;
  } catch {
    return fallbackKey;
  }
}
