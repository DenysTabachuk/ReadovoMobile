type ErrorResponseBody = {
  message?: string | string[];
};

// TODO: Resolve stable backend error codes instead of message text. See docs/mascot-error-codes.md.
/**
 * Translate recognized mascot API errors into UI message keys.
 *
 * Consumes the response body. JSON parsing and body-reading errors are handled with the
 * fallback key.
 *
 * @param response - Error response with an unread JSON body.
 * @param fallbackKey - Translation key to return for an unknown or unreadable error.
 * @returns The recognized error key, or fallbackKey. For message arrays, only the first
 *   message is checked.
 * @example
 * await resolveMascotErrorMessage(new Response(JSON.stringify({ message: 'Not enough coins.' })), 'mascot.errors.generic');
 * // => 'mascot.errors.notEnoughCoins'
 */
export async function resolveMascotErrorMessage(
  response: Response,
  fallbackKey: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponseBody;
    const rawMessage = Array.isArray(body.message)
      ? body.message[0]
      : body.message;

    if (rawMessage === 'Not enough coins.') {
      return 'mascot.errors.notEnoughCoins';
    }

    if (rawMessage === 'Mascot item is not owned.') {
      return 'mascot.errors.itemNotOwned';
    }
  } catch {
    return fallbackKey;
  }

  return fallbackKey;
}
