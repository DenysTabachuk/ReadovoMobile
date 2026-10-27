/**
 * Decodes a local JWT subject once when establishing an authenticated session.
 * The standard `sub` (subject) claim contains our backend's user ID. It identifies
 * which local account the session belongs to; decoding does not authenticate it.
 * This helper does not verify the signature or expiration. The backend must
 * verify the token before granting access, even when a local owner was decoded.
 * @param token - Access token received from login, refresh, or persisted hydration.
 * @returns Nonempty subject, or throws for missing/malformed identity.
 * @example
 * getSessionOwner('header.eyJzdWIiOiJyZWFkZXItYSJ9.signature'); // => 'reader-a'
 */
export function getSessionOwner(token: string | null): string {
  try {
    const payload = token?.split('.')[1] ?? '';
    // JWT uses Base64URL (- and _); atob expects Base64 (+ and /). Restore that
    // alphabet before decoding. This is encoding conversion, not decryption.
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { sub } = JSON.parse(atob(normalized)) as { sub?: unknown };
    if (typeof sub === 'string' && sub.trim()) return sub;
  } catch {
    // Invalid Base64/JSON (or a non-object payload) can throw here. Intentionally
    // fall through to the same error used for a missing/invalid sub below; errors
    // are not ignored and no token contents are logged or used as a fallback.
  }
  throw new Error('Missing or invalid authentication session owner.');
}
