import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from './constants';
import { type AuthSessionResponse } from './types';

export const AUTH_ACCESS_TOKEN_STORAGE_KEY = 'readovo.auth.accessToken';
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'readovo.auth.refreshToken';

let refreshSessionPromise: Promise<AuthSessionResponse | null> | null = null;

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = await getAccessToken();
  const headers = new Headers(init.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedSession = await refreshAuthSession();

  if (!refreshedSession) {
    return response;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set('Authorization', `Bearer ${refreshedSession.accessToken}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
  });
}

export async function persistAuthTokens(session: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, session.accessToken),
    AsyncStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, session.refreshToken),
  ]);
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY),
    AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
  ]);
}

export async function refreshAuthSession(): Promise<AuthSessionResponse | null> {
  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshAuthSessionOnce().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
}

async function refreshAuthSessionOnce(): Promise<AuthSessionResponse | null> {
  const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);

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

  const session = (await response.json()) as AuthSessionResponse;
  await persistAuthTokens(session);

  return session;
}

async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
}
