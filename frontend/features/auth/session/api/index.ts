import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponseTransformer,
} from 'axios';

import { API_BASE_URL, HTTP_STATUS } from '@/api';
import { HttpError } from '@/api/httpError';
import { createHttpClient } from '@/api/utils/createHttpClient';

import { authSessionStore } from '../authTokenStorage/authSessionStore';
import { refreshAuthSession } from '../refreshAuthSession';

type SessionConfig = InternalAxiosRequestConfig & {
  // Internal Axios metadata, never part of the HTTP headers or request body.
  authSession?: {
    // Session number captured when the request interceptor starts. Login/logout
    // changes this number; refreshing tokens keeps it. Retries retain the original
    // version so a request cannot continue under a different login.
    version: number;
    // Set before refresh for an eligible auth 401. A second 401 must reject
    // rather than start another refresh/retry cycle.
    retried: boolean;
  };
};

const REFRESHABLE_AUTH_CODES = [
  'AUTH_AUTHENTICATION_REQUIRED',
  'AUTH_ACCESS_TOKEN_INVALID',
  'AUTH_ACCESS_TOKEN_EXPIRED',
];

/**
 * Axios client for authenticated API calls. Interceptors are registered once,
 * when this module loads; consumers call api.get/post/etc. normally.
 *
 * Request -> validate destination -> capture session -> read JWT -> send
 * Response -> verify original session -> return data
 * Eligible auth 401 -> shared refresh -> verify session -> retry with the new JWT
 * Other codes/errors / second 401 -> reject -> shared error normalization
 *
 * A session change after capture rejects with AbortError, including during token
 * reads, response parsing and refresh. It cannot undo work already done by the server.
 */
export const api = createHttpClient((client) => {
  client.interceptors.request.use(async (config: SessionConfig) => {
    // Validate the actual destination before attaching credentials; baseURL alone
    // does not prevent Axios callers from supplying an external absolute URL.
    const target = new URL(
      axios.getUri({ baseURL: API_BASE_URL, url: config.url }),
      API_BASE_URL,
    );
    if (
      target.origin !== new URL(API_BASE_URL).origin ||
      target.username ||
      target.password
    ) {
      throw new Error(
        'Authenticated requests must target the application API.',
      );
    }
    // Retain this metadata when Axios re-enters the interceptor for a retry.
    const session = config.authSession ?? {
      version: authSessionStore.version,
      retried: false,
    };
    config.authSession = session;
    try {
      authSessionStore.assertCurrent(session.version);
      const { accessToken } = await authSessionStore.read();
      // Storage is asynchronous: login/logout may have happened during the read.
      authSessionStore.assertCurrent(session.version);
      config.baseURL = API_BASE_URL;
      config.allowAbsoluteUrls = true;
      config.url = target.href;
      // Axios's `auth` option is Basic Auth and could overwrite our Bearer header.
      config.auth = undefined;
      config.headers.set(
        'Authorization',
        accessToken ? `Bearer ${accessToken}` : null,
      );
      // Check before parsing too: stale malformed bodies must not become retryable errors.
      const transforms = config.transformResponse;
      const guard: AxiosResponseTransformer = (data: unknown) => {
        authSessionStore.assertCurrent(session.version);
        return data;
      };
      if (!session.retried) {
        // The retry already carries this guard; do not prepend it a second time.
        config.transformResponse = [
          guard,
          ...(Array.isArray(transforms)
            ? transforms
            : transforms
              ? [transforms]
              : []),
        ];
      }
      return config;
    } catch (error) {
      // If the session changed, report cancellation instead of a storage failure
      // belonging to an obsolete login. Otherwise preserve the original error.
      authSessionStore.assertCurrent(session.version);
      throw error;
    }
  });

  client.interceptors.response.use(
    (response) => {
      // A successful HTTP response is still unusable if it belongs to an old login.
      const config: SessionConfig = response.config;
      const session = config.authSession;
      if (session) authSessionStore.assertCurrent(session.version);
      return response;
    },
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) throw error;
      const config: SessionConfig | undefined = error.config;
      const session = config?.authSession;
      if (!config || !session) throw error;
      authSessionStore.assertCurrent(session.version);
      const response = error.response;
      if (
        !response ||
        response.status !== HTTP_STATUS.unauthorized ||
        session.retried
      )
        throw error;
      // This interceptor runs before shared error normalization. Reuse HttpError's
      // minimal code extraction without introducing another response parser.
      const { code } = new HttpError(response);
      if (!code || !REFRESHABLE_AUTH_CODES.includes(code)) throw error;
      session.retried = true;
      try {
        // For this session, the first eligible 401 starts refresh; concurrent ones
        // await the same Promise. Each interceptor then retries its own request.
        // See refreshAuthSession for the flow diagram and Promise lifecycle.
        // Refresh uses the public client, so its failure cannot trigger refresh again.
        const refreshed = await refreshAuthSession(session.version);
        if (!refreshed) throw error;
        // The request interceptor checks the original session before attaching
        // the rotated JWT. Await so failures also pass through the check below.
        return await client.request(config);
      } catch (refreshError) {
        authSessionStore.assertCurrent(session.version);
        throw refreshError;
      }
    },
  );
});
