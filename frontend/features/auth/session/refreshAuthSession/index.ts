import { API_BASE_URL } from '@/api';

import {
  clearAuthTokens,
  getRefreshToken,
  persistAuthTokens,
} from '../authTokenStorage';
import { type AuthTokens } from '../types';

let refreshSessionPromise: Promise<AuthTokens | null> | null = null;

export async function refreshAuthSession(): Promise<AuthTokens | null> {
  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshAuthSessionOnce().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
}

async function refreshAuthSessionOnce(): Promise<AuthTokens | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    await clearAuthTokens();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    await clearAuthTokens();
    return null;
  }

  const session = (await response.json()) as AuthTokens;
  await persistAuthTokens(session);

  return session;
}
