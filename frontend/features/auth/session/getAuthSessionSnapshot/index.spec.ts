import { authSessionStore } from '../authTokenStorage/authSessionStore';
import { getAuthSessionSnapshot } from '.';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
});

const TOKEN_A = {
  accessToken: `header.${btoa(JSON.stringify({ sub: 'reader-a' }))}.sig`,
  refreshToken: 'refresh-a',
};
const TOKEN_B = {
  accessToken: `header.${btoa(JSON.stringify({ sub: 'reader-b' }))}.sig`,
  refreshToken: 'refresh-b',
};

beforeEach(async () => {
  await authSessionStore.replace(TOKEN_A);
});

it('keeps the same snapshot valid through refresh token rotation', async () => {
  const session = await getAuthSessionSnapshot('reader-a');
  const version = authSessionStore.version;
  await authSessionStore.commitRefresh({
    version,
    tokens: { ...TOKEN_A, refreshToken: 'rotated-a' },
  });
  expect(() => session.assertCurrent()).not.toThrow();
});

it.each(['logout', 'other account', 'same account login'])(
  'invalidates the snapshot after %s',
  async (change) => {
    const session = await getAuthSessionSnapshot('reader-a');
    if (change === 'logout') {
      await authSessionStore.clear();
    } else {
      await authSessionStore.replace(
        change === 'other account' ? TOKEN_B : TOKEN_A,
      );
    }
    expect(() => session.assertCurrent()).toThrow(
      expect.objectContaining({ name: 'AbortError' }),
    );
  },
);

it('rejects a stale caller expecting a different owner before starting work', async () => {
  await expect(getAuthSessionSnapshot('reader-b')).rejects.toMatchObject({
    name: 'AbortError',
  });
});

it.each([
  'invalid-token',
  'header.invalid-json.sig',
  `header.${btoa('{}')}.sig`,
  `header.${btoa('{"sub":12}')}.sig`,
  `header.${btoa('null')}.sig`,
])('rejects missing or unreadable subjects: %s', async (accessToken) => {
  await authSessionStore.replace({ ...TOKEN_A, accessToken });
  await expect(getAuthSessionSnapshot('reader-a')).rejects.toMatchObject({
    name: 'AbortError',
  });
});

it('rejects when no token is stored', async () => {
  await authSessionStore.clear();
  await expect(getAuthSessionSnapshot('reader-a')).rejects.toMatchObject({
    name: 'AbortError',
  });
});

it('rejects an account change queued during the snapshot read', async () => {
  const pending = getAuthSessionSnapshot('reader-a');
  const assertion = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await authSessionStore.replace(TOKEN_B);
  await assertion;
});
