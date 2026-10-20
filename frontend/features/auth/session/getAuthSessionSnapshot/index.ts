import { authSessionStore } from '../authTokenStorage/authSessionStore';

/**
 * Binds a multi-step operation to its expected account and current login session.
 * The decoded token subject is a local stale-work check, not signature verification.
 *
 * @param userId - Expected local owner, never sent to the backend by this helper.
 * @returns An assertion to call before subsequent requests and after awaited work.
 * Missing/malformed tokens, a different owner, or login/logout reject with AbortError.
 * Token refresh keeps the snapshot valid; a new login invalidates it, even for the same user.
 * @example
 * const session = await getAuthSessionSnapshot(userId);
 * await loadPendingEvents();
 * session.assertCurrent();
 * // Safe to start the next request in this session without passing an owner ID.
 */
export async function getAuthSessionSnapshot(userId: string) {
  const version = authSessionStore.version;
  const { accessToken } = await authSessionStore.read();
  authSessionStore.assertCurrent(version);

  let subject: unknown;
  try {
    const encodedPayload = accessToken?.split('.')[1] ?? '';
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized)) as { sub?: unknown };
    subject = payload?.sub;
  } catch {
    // Missing or unreadable tokens cannot establish the operation's owner.
  }

  if (!userId || subject !== userId) {
    const error = new Error(
      'Authentication session does not match operation owner.',
    );
    error.name = 'AbortError';
    throw error;
  }

  return {
    assertCurrent(): void {
      authSessionStore.assertCurrent(version);
    },
  };
}
