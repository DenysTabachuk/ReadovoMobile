import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
} from '../../constants';
import type { AuthTokens } from '../../../types';

type TokenStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

type RefreshCommit = {
  version: number;
  tokens: AuthTokens;
};

/**
 * Coordinates token storage and assigns a new session version on sign-in/logout.
 * Storage operations run in order, even after failures. Refresh may update tokens
 * only for its original version; token rotation does not start a new session.
 * Versions belong to this process and are not persisted across app restarts.
 *
 * @param storage - Async token storage; all session writes must use this store.
 * @returns Session version, serialized reads/writes, conditional refresh writes,
 * conditional clearing, synchronous change subscriptions, and an assertion
 * throwing an AbortError for stale work. Refresh does not notify subscribers.
 * @example
 * const store = createAuthSessionStore(storage);
 * const version = store.version;
 * await store.replace({ accessToken: 'B-access', refreshToken: 'B-refresh' });
 * await store.commitRefresh({ version, tokens: oldTokens });
 * // => false; the previous session cannot overwrite B's tokens.
 */
export function createAuthSessionStore(storage: TokenStorage) {
  let version = 0;
  let pendingStorage: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();

  function invalidateSession(): void {
    version += 1;
    // Stop scheduled work before asynchronous storage or a new login can proceed.
    for (const listener of listeners) listener();
  }

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pendingStorage.then(operation);
    // A failed operation must reject its caller without blocking future logins.
    pendingStorage = result.then(
      () => undefined, // success
      () => undefined, // error
    );
    return result;
  }

  async function writeTokens(tokens: AuthTokens): Promise<void> {
    await settleStorageWrites([
      storage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken),
      storage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken),
    ]);
  }

  async function settleStorageWrites(writes: Promise<void>[]): Promise<void> {
    // Wait for both writes even when one fails, before starting the next operation.
    const results = await Promise.allSettled(writes);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') {
      throw failure.reason;
    }
  }

  function clear(): Promise<void> {
    invalidateSession();
    return enqueue(async () => {
      await settleStorageWrites([
        storage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY),
        storage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
      ]);
    });
  }

  return {
    /** Current session number. Capture it before starting asynchronous work. */
    get version() {
      return version;
    },
    /** Subscribes to synchronous login/logout invalidation; returns an unsubscribe function. */
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /**
     * Rejects a result or retry belonging to an earlier session with AbortError.
     * Call after awaiting work; this check does not cancel the network request.
     */
    assertCurrent(expectedVersion: number): void {
      if (version !== expectedVersion) {
        const error = new Error('Authentication session changed.');
        error.name = 'AbortError';
        throw error;
      }
    },
    /** Reads both tokens after earlier storage operations finish; missing tokens are null. */
    read() {
      return enqueue(async () => {
        const [accessToken, refreshToken] = await Promise.all([
          storage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY),
          storage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
        ]);
        return { accessToken, refreshToken };
      });
    },
    /**
     * Starts a new session on sign-in and queues its token pair for storage.
     * Refresh must use commitRefresh so token rotation keeps the same session.
     */
    replace(tokens: AuthTokens): Promise<void> {
      // Invalidate outstanding work immediately, before asynchronous storage I/O.
      invalidateSession();
      return enqueue(() => writeTokens(tokens));
    },
    /** Ends the session immediately and queues token removal, including on logout. */
    clear,
    /** Lets a failed refresh clear its own session; does nothing if the session changed. */
    clearIfCurrent(expectedVersion: number): Promise<void> {
      return version === expectedVersion ? clear() : Promise.resolve();
    },
    /**
     * Queues refreshed tokens for the initiating session without changing its version.
     * Returns false if the session changed before or during the write. A login/logout
     * queued during the write runs afterward, so its token changes take precedence.
     */
    commitRefresh({ version: expectedVersion, tokens }: RefreshCommit) {
      return enqueue(async () => {
        if (version !== expectedVersion) {
          return false;
        }
        await writeTokens(tokens);
        // A new login/logout may have been queued while storage was writing.
        return version === expectedVersion;
      });
    },
  };
}
