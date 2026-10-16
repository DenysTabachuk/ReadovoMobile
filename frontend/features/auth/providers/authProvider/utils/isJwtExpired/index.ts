const MILLISECONDS_PER_SECOND = 1000;

/**
 * Determine whether a stored access token should be treated as expired.
 *
 * Reads the current time and decodes the payload with atob. This is a local expiration
 * check, not signature verification.
 *
 * @param token - JWT string, or null when no token is stored.
 * @returns True for missing, undecodable, or expired tokens and payloads without a numeric
 *   exp; false for a future expiration.
 * @example
 * isJwtExpired(null);
 * // => true
 */
export function isJwtExpired(token: string | null): boolean {
  if (!token) {
    return true;
  }

  try {
    const [, encodedPayload] = token.split('.');
    const payload = JSON.parse(atob(encodedPayload ?? '')) as { exp?: number };

    return (
      typeof payload.exp !== 'number' ||
      payload.exp * MILLISECONDS_PER_SECOND <= Date.now()
    );
  } catch {
    return true;
  }
}
