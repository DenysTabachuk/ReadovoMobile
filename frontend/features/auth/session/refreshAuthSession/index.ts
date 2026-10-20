import { API_BASE_URL } from '@/api';

import { authSessionStore } from '../authTokenStorage/authSessionStore';
import { type AuthTokens } from '../types';

const pendingRefreshes = new Map<number, Promise<AuthTokens | null>>();

/**
 * Refreshes tokens for one session, sharing concurrent refreshes of that version.
 * Captures its refresh token before the HTTP call. Obsolete responses neither
 * replace nor clear a newer session's tokens; new sessions use separate requests.
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

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (version !== authSessionStore.version) {
    return null;
  }
  if (!response.ok) {
    await authSessionStore.clearIfCurrent(version);
    return null;
  }

  const tokens = (await response.json()) as AuthTokens;
  const committed = await authSessionStore.commitRefresh({ version, tokens });
  return committed ? tokens : null;
}
