import { HTTP_STATUS } from '@/api';

import { getAccessToken } from '../authTokenStorage';
import { refreshAuthSession } from '../refreshAuthSession';

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

  if (response.status !== HTTP_STATUS.unauthorized) {
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
