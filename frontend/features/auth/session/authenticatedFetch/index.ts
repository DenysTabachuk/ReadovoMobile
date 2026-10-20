import { HTTP_STATUS } from '@/api';

import { authSessionStore } from '../authTokenStorage/authSessionStore';
import { refreshAuthSession } from '../refreshAuthSession';

/**
 * Sends a request with the current session's token and retries once after a 401.
 * A sign-in/logout invalidates the operation: it rejects with an AbortError
 * instead of returning a stale response or retrying as another session.
 * This does not undo requests already received by the server.
 *
 * @param input - URL or request accepted by fetch.
 * @param init - Fetch options; the stored access token supplies Authorization.
 * @returns Response from the original session, or a rejected request on failure.
 * @example
 * const response = await authenticatedFetch('/api/dictionary/me/words');
 * // A 401 may refresh and retry; changing accounts while waiting aborts the result.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const version = authSessionStore.version;
  try {
    const { accessToken } = await authSessionStore.read();
    authSessionStore.assertCurrent(version);
    const headers = new Headers(init.headers);

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(input, {
      ...init,
      headers,
    });
    authSessionStore.assertCurrent(version);

    if (response.status !== HTTP_STATUS.unauthorized) {
      return response;
    }

    const refreshedSession = await refreshAuthSession(version);

    authSessionStore.assertCurrent(version);

    if (!refreshedSession) {
      return response;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set('Authorization', `Bearer ${refreshedSession.accessToken}`);

    const retryResponse = await fetch(input, {
      ...init,
      headers: retryHeaders,
    });
    authSessionStore.assertCurrent(version);
    return retryResponse;
  } catch (error) {
    authSessionStore.assertCurrent(version);
    throw error;
  }
}
