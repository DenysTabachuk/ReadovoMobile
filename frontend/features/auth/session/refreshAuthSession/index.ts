import { httpClient } from '@/api/httpClient';
import { HttpError } from '@/api/httpError';
import { API_BASE_URL } from '@/api';

import { authSessionStore } from '../authTokenStorage/authSessionStore';
import { type AuthTokens } from '../types';

// One in-flight refresh Promise per session version, not one per failed request.
// The first caller starts refresh; concurrent callers await that same Promise.
// A new login has a different version and cannot join the previous login's refresh.
const pendingRefreshes = new Map<number, Promise<AuthTokens | null>>();

/**
 * Refreshes tokens for one session, sharing concurrent refreshes of that version.
 * Captures its refresh token before the HTTP call. Obsolete responses neither
 * replace nor clear a newer session's tokens; new sessions use separate requests.
 *
 * Example: three API requests receive 401 while the same refresh is pending:
 *   profile    -> 401 --\
 *   dictionary -> 401 ----> one POST /auth/refresh -> new JWT
 *   streak     -> 401 --/
 * Each waiting interceptor then retries its own original request with the new JWT,
 * provided the session is still current. Refresh failure does not retry those calls.
 * Sharing lasts only while refresh is pending; this is not a token/result cache.
 *
 * @param version - Initiating session version; defaults to the current session.
 * @returns Refreshed tokens, or null for an obsolete/unsuccessful session.
 * Network and storage failures reject without clearing unrelated sessions.
 * @example
 * const tokens = await refreshAuthSession();
 * // Persists rotated tokens if the same session is still active; otherwise null.
 */
export function refreshAuthSession(
  version = authSessionStore.version,
): Promise<AuthTokens | null> {
  if (version !== authSessionStore.version) {
    return Promise.resolve(null);
  }
  const pending = pendingRefreshes.get(version);
  if (pending) {
    return pending;
  }
  const refresh = refreshAuthSessionOnce(version).finally(() => {
    // Release on success or failure so a later call can start a fresh attempt.
    pendingRefreshes.delete(version);
  });
  pendingRefreshes.set(version, refresh);
  return refresh;
}

async function refreshAuthSessionOnce(
  version: number,
): Promise<AuthTokens | null> {
  const { refreshToken } = await authSessionStore.read();
  if (version !== authSessionStore.version) {
    return null;
  }
  if (!refreshToken) {
    await authSessionStore.clearIfCurrent(version);
    return null;
  }

  const response = await httpClient(`${API_BASE_URL}/auth/refresh`, {
    data: { refreshToken },
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).catch(async (error: unknown) => {
    if (!(error instanceof HttpError)) throw error;
    await authSessionStore.clearIfCurrent(version);
    return null;
  });

  if (!response || version !== authSessionStore.version) {
    return null;
  }

  const tokens = response.data as AuthTokens;
  const committed = await authSessionStore.commitRefresh({ version, tokens });
  return committed ? tokens : null;
}
