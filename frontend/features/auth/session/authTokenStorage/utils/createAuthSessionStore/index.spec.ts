import { createAuthSessionStore } from '.';
import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
} from '../../constants';

const TOKENS_A = { accessToken: 'access-A', refreshToken: 'refresh-A' };
const TOKENS_B = { accessToken: 'access-B', refreshToken: 'refresh-B' };

describe('createAuthSessionStore', () => {
  function setup() {
    const values = new Map<string, string>();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    return { store: createAuthSessionStore(storage), storage, values };
  }

  it('persists token pairs, isolates sign-ins, and clears both tokens on logout', async () => {
    const { store } = setup();
    expect(await store.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
    const version = store.version;
    const write = store.replace(TOKENS_A);
    expect(() => store.assertCurrent(version)).toThrow(
      'Authentication session changed.',
    );
    await write;
    expect(await store.read()).toEqual(TOKENS_A);
    const loginVersion = store.version;
    await store.clear();
    expect(store.version).toBeGreaterThan(loginVersion);
    expect(await store.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });

  it('accepts refresh tokens only for the current session without changing its version', async () => {
    const { store } = setup();
    await store.replace(TOKENS_A);
    const version = store.version;
    await expect(
      store.commitRefresh({ version, tokens: TOKENS_B }),
    ).resolves.toBe(true);
    expect(store.version).toBe(version);
    expect(await store.read()).toEqual(TOKENS_B);
    await store.replace(TOKENS_A);
    await expect(
      store.commitRefresh({ version, tokens: TOKENS_B }),
    ).resolves.toBe(false);
    await store.clearIfCurrent(version);
    expect(await store.read()).toEqual(TOKENS_A);
  });

  it('does not revive old operations when the same account signs in again', async () => {
    const { store } = setup();
    await store.replace(TOKENS_A);
    const version = store.version;
    await store.clear();
    await store.replace(TOKENS_A);
    expect(() => store.assertCurrent(version)).toThrow(
      expect.objectContaining({ name: 'AbortError' }),
    );
  });

  it('serializes a login after a refresh write already in progress', async () => {
    const { store, storage, values } = setup();
    await store.replace(TOKENS_A);
    const version = store.version;
    const started = Promise.withResolvers<void>();
    const finishWrite = Promise.withResolvers<void>();
    storage.setItem.mockImplementationOnce(async (key, value) => {
      started.resolve();
      await finishWrite.promise;
      values.set(key, value);
    });
    const refresh = store.commitRefresh({
      version,
      tokens: { accessToken: 'old-rotated', refreshToken: 'old-refresh' },
    });
    await started.promise;
    const login = store.replace(TOKENS_B);
    finishWrite.resolve();
    await expect(refresh).resolves.toBe(false);
    await login;
    expect(await store.read()).toEqual(TOKENS_B);
  });

  it('waits for all failed-operation writes before allowing the next login', async () => {
    const { store, storage, values } = setup();
    const finishWrite = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    const failure = new Error('Storage failure');
    storage.setItem.mockImplementation(async (key, value) => {
      if (value === 'access-A') {
        throw failure;
      }
      if (value === 'refresh-A') {
        started.resolve();
        await finishWrite.promise;
      }
      values.set(key, value);
    });
    const failedWrite = store.replace(TOKENS_A);
    const rejected = expect(failedWrite).rejects.toBe(failure);
    await started.promise;
    const login = store.replace(TOKENS_B);
    finishWrite.resolve();
    await rejected;
    await login;
    expect(values.get(AUTH_ACCESS_TOKEN_STORAGE_KEY)).toBe('access-B');
    expect(values.get(AUTH_REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-B');
  });

  it('keeps old work invalidated after a failed logout and allows a new login', async () => {
    const { store, storage } = setup();
    await store.replace(TOKENS_A);
    const version = store.version;
    const failure = new Error('Token removal failed');
    storage.removeItem.mockRejectedValueOnce(failure);
    const logout = store.clear();
    expect(() => store.assertCurrent(version)).toThrow(
      expect.objectContaining({ name: 'AbortError' }),
    );
    await expect(logout).rejects.toBe(failure);
    await store.replace(TOKENS_B);
    expect(await store.read()).toEqual(TOKENS_B);
  });
});
