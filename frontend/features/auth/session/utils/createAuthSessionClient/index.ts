import { HTTP_STATUS } from '@/api';

import { authSessionStore } from '../../authTokenStorage/authSessionStore';
import { refreshAuthSession } from '../../refreshAuthSession';
import type { AuthSessionClient, SessionRequest } from '../../types';

type CreateAuthSessionClientParams = {
  ownerId: string;
  version: number;
};

/**
 * Creates an immutable transport bound to an already established login version.
 * @param params - Validated owner and the version that persisted its credentials.
 * @returns Client whose requests reject stale/canceled work with AbortError, even
 * when fetch or body parsing ignores cancellation. Parsers must return eager data.
 * @example
 * const session = createAuthSessionClient({ ownerId: 'a', version: authSessionStore.version });
 * await session.request({ input: '/me', parse: async (response) => response.json() });
 * // Uses only a's session, including after a 401 refresh.
 */
export function createAuthSessionClient({
  ownerId,
  version,
}: CreateAuthSessionClientParams): AuthSessionClient {
  authSessionStore.assertCurrent(version);
  const signal = authSessionStore.signal;

  return Object.freeze({
    id: Symbol('auth-session'),
    ownerId,
    signal,
    get isActive() {
      return !signal.aborted && authSessionStore.version === version;
    },
    async request<T>({
      input,
      init = {},
      parse,
    }: SessionRequest<T>): Promise<T> {
      const controller = new AbortController();
      const callerSignal =
        init.signal ?? (input instanceof Request ? input.signal : undefined);
      const abort = () => controller.abort();
      const assertActive = () => {
        authSessionStore.assertCurrent(version);
        if (signal.aborted || callerSignal?.aborted) {
          const error = new Error('Authenticated operation canceled.');
          error.name = 'AbortError';
          throw error;
        }
      };

      // Race every boundary, including transports/parsers that ignore AbortSignal.
      const canceled = new Promise<never>((_, reject) => {
        controller.signal.onabort = () => {
          const error = new Error('Authenticated operation canceled.');
          error.name = 'AbortError';
          reject(error);
        };
      });
      async function wait<TValue>(work: Promise<TValue>): Promise<TValue> {
        const value = await Promise.race([work, canceled]);
        assertActive();
        return value;
      }

      try {
        assertActive();
        signal.addEventListener('abort', abort, { once: true });
        callerSignal?.addEventListener('abort', abort, { once: true });
        const { accessToken } = await wait(authSessionStore.read(version));
        if (!accessToken)
          throw new Error('Missing authentication credentials.');
        const send = (token: string) => {
          assertActive();
          const headers = new Headers(
            init.headers ??
              (input instanceof Request ? input.headers : undefined),
          );
          headers.set('Authorization', `Bearer ${token}`);
          // A Request body must remain reusable for the single refresh retry.
          return fetch(input instanceof Request ? input.clone() : input, {
            ...init,
            headers,
            signal: controller.signal,
          });
        };
        let response = await wait(send(accessToken));
        if (response.status === HTTP_STATUS.unauthorized) {
          const tokens = await wait(refreshAuthSession(version));
          if (tokens) response = await wait(send(tokens.accessToken));
        }
        return await wait(parse(response));
      } catch (error) {
        assertActive();
        throw error;
      } finally {
        controller.signal.onabort = null;
        signal.removeEventListener('abort', abort);
        callerSignal?.removeEventListener('abort', abort);
      }
    },
  });
}
