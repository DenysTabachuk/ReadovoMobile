import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAuthSessionController } from '.';
import { authSessionStore } from '../../../../session/authTokenStorage/authSessionStore';
import { AUTH_STORAGE_KEYS } from '../../constants';

jest.mock('@/api', () => ({
  API_BASE_URL: 'https://api.test',
  HTTP_STATUS: { unauthorized: 401 },
}));
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

function tokens(owner: string, exp = 4_000_000_000) {
  return {
    accessToken: `header.${Buffer.from(JSON.stringify({ sub: owner, exp })).toString('base64url')}.signature`,
    refreshToken: `refresh-${owner}`,
  };
}

const A = tokens('a');
const B = tokens('b');
const PROFILE_A = { id: 'a', displayName: 'Reader A', email: 'a@example.test' };
const PROFILE_B = { id: 'b', displayName: 'Reader B', email: 'b@example.test' };
const storageImplementations = {
  getItem: jest.mocked(AsyncStorage.getItem).getMockImplementation()!,
  setItem: jest.mocked(AsyncStorage.setItem).getMockImplementation()!,
  removeItem: jest.mocked(AsyncStorage.removeItem).getMockImplementation()!,
};
let auth: ReturnType<typeof createAuthSessionController>;

beforeEach(async () => {
  jest
    .mocked(AsyncStorage.getItem)
    .mockReset()
    .mockImplementation(storageImplementations.getItem);
  jest
    .mocked(AsyncStorage.setItem)
    .mockReset()
    .mockImplementation(storageImplementations.setItem);
  jest
    .mocked(AsyncStorage.removeItem)
    .mockReset()
    .mockImplementation(storageImplementations.removeItem);
  await authSessionStore.clear();
  await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.rememberMe);
  await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.userProfile);
  auth = createAuthSessionController(AsyncStorage);
});
afterEach(() => {
  auth.dispose();
  jest.restoreAllMocks();
});

it('publishes matching owner/client/profile only after persistence completes', async () => {
  const saved = Promise.withResolvers<void>();
  const saving = Promise.withResolvers<void>();
  jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(() => {
    saving.resolve();
    return saved.promise;
  });
  const pending = auth.signIn({
    rememberMe: true,
    tokens: A,
    userProfile: PROFILE_A,
  });
  await saving.promise;
  expect(auth.getSnapshot()).toMatchObject({
    session: null,
    currentUser: null,
    isAuthenticated: false,
  });
  saved.resolve();
  await pending;
  expect(auth.getSnapshot()).toMatchObject({
    currentUser: PROFILE_A,
    session: { ownerId: 'a', isActive: true },
    isAuthenticated: true,
  });
});

it('derives a usable currentUser from the token when no profile is supplied', async () => {
  await auth.signIn({ rememberMe: false, tokens: A });
  expect(auth.getSnapshot().currentUser).toEqual({
    id: 'a',
    displayName: null,
    email: null,
  });
  expect(auth.getSnapshot().session?.ownerId).toBe('a');
  expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.userProfile)).toBeNull();
  await auth.hydrate();
  expect(auth.getSnapshot().isAuthenticated).toBe(true);
});

it('invalidates before preference I/O and creates a fresh identity for the same owner', async () => {
  await auth.signIn({ rememberMe: true, tokens: A });
  const previous = auth.getSnapshot().session!;
  const pending = auth.signIn({ rememberMe: false, tokens: A });
  expect(previous.signal.aborted).toBe(true);
  expect(auth.getSnapshot().session).toBeNull();
  expect(auth.getSnapshot().currentUser).toBeNull();
  await pending;
  expect(auth.getSnapshot().session?.id).not.toBe(previous.id);
});

it('signs out synchronously and late logout cannot clear a replacement login', async () => {
  await auth.signIn({ rememberMe: true, tokens: A, userProfile: PROFILE_A });
  const previous = auth.getSnapshot().session!;
  const removed = Promise.withResolvers<void>();
  const removing = Promise.withResolvers<void>();
  jest.spyOn(AsyncStorage, 'removeItem').mockImplementationOnce(() => {
    removing.resolve();
    return removed.promise;
  });
  const logout = auth.signOut();
  expect(previous.signal.aborted).toBe(true);
  expect(auth.getSnapshot()).toMatchObject({
    session: null,
    currentUser: null,
    isAuthenticated: false,
  });
  await removing.promise;
  const login = auth.signIn({
    rememberMe: true,
    tokens: B,
    userProfile: PROFILE_B,
  });
  removed.resolve();
  await Promise.all([logout, login]);
  expect(auth.getSnapshot()).toMatchObject({
    currentUser: PROFILE_B,
    session: { ownerId: 'b' },
    isAuthenticated: true,
  });
  expect(await authSessionStore.read()).toEqual(B);
  expect(
    JSON.parse((await AsyncStorage.getItem(AUTH_STORAGE_KEYS.userProfile))!),
  ).toEqual(PROFILE_B);
});

it('serializes metadata and does not publish a login superseded while writing preferences', async () => {
  const saved = Promise.withResolvers<void>();
  const saving = Promise.withResolvers<void>();
  const original = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
    if (key === AUTH_STORAGE_KEYS.rememberMe && value === 'true') {
      saving.resolve();
      await saved.promise;
    }
    await original(key, value);
  });
  const first = auth.signIn({
    rememberMe: true,
    tokens: A,
    userProfile: PROFILE_A,
  });
  const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
  await saving.promise;
  const second = auth.signIn({
    rememberMe: false,
    tokens: B,
    userProfile: PROFILE_B,
  });
  saved.resolve();
  await rejected;
  await second;
  expect(auth.getSnapshot()).toMatchObject({
    currentUser: PROFILE_B,
    rememberMePreference: false,
    session: { ownerId: 'b' },
  });
  expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.rememberMe)).toBe(
    'false',
  );
  expect(await AsyncStorage.getItem(AUTH_STORAGE_KEYS.userProfile)).toBeNull();
});

it.each([tokens(''), { accessToken: 'malformed', refreshToken: 'refresh' }])(
  'rejects invalid ownership and clears unusable credentials',
  async (invalid) => {
    await expect(
      auth.signIn({ rememberMe: true, tokens: invalid }),
    ).rejects.toThrow('owner');
    expect(auth.getSnapshot().session).toBeNull();
    expect(await authSessionStore.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  },
);

it('rejects a mismatched profile and permits a later valid sign-in', async () => {
  await expect(
    auth.signIn({ rememberMe: true, tokens: A, userProfile: PROFILE_B }),
  ).rejects.toThrow('mismatch');
  expect(auth.getSnapshot().isAuthenticated).toBe(false);
  await auth.signIn({ rememberMe: true, tokens: B, userProfile: PROFILE_B });
  expect(auth.getSnapshot().session?.ownerId).toBe('b');
});

it('does not publish or leave credentials after token storage failure', async () => {
  const failure = new Error('token storage failed');
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(failure);
  await expect(auth.signIn({ rememberMe: true, tokens: A })).rejects.toBe(
    failure,
  );
  expect(auth.getSnapshot().session).toBeNull();
  expect(await authSessionStore.read()).toEqual({
    accessToken: null,
    refreshToken: null,
  });
  await auth.signIn({ rememberMe: true, tokens: B });
  expect(auth.getSnapshot().session?.ownerId).toBe('b');
});

it('cleans up credentials after metadata storage failure', async () => {
  const failure = new Error('profile storage failed');
  const original = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
    if (key === AUTH_STORAGE_KEYS.userProfile) throw failure;
    await original(key, value);
  });
  await expect(
    auth.signIn({ rememberMe: true, tokens: A, userProfile: PROFILE_A }),
  ).rejects.toBe(failure);
  expect(auth.getSnapshot().session).toBeNull();
  expect(await authSessionStore.read()).toEqual({
    accessToken: null,
    refreshToken: null,
  });
});

it('remains unavailable when logout storage fails', async () => {
  await auth.signIn({ rememberMe: true, tokens: A });
  const failure = new Error('remove failed');
  jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(failure);
  await expect(auth.signOut()).rejects.toBe(failure);
  expect(auth.getSnapshot()).toMatchObject({
    session: null,
    currentUser: null,
    isAuthenticated: false,
  });
});

it.each([true, false])(
  'hydrates one coherent owner with stored profile present=%s',
  async (withProfile) => {
    await authSessionStore.replace(A);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.rememberMe, 'true');
    if (withProfile)
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEYS.userProfile,
        JSON.stringify(PROFILE_A),
      );
    // A newly constructed controller represents startup after credentials were persisted.
    auth.dispose();
    auth = createAuthSessionController(AsyncStorage);
    const hydration = auth.hydrate();
    expect(auth.hydrate()).toBe(hydration);
    expect(auth.getSnapshot().session).toBeNull();
    await hydration;
    expect(auth.getSnapshot()).toMatchObject({
      currentUser: { id: 'a' },
      session: { ownerId: 'a' },
      isAuthenticated: true,
      isHydratingAuth: false,
    });
  },
);

it('refreshes an expired persisted session before publishing its owner', async () => {
  await authSessionStore.replace(tokens('a', 1));
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.rememberMe, 'true');
  auth.dispose();
  auth = createAuthSessionController(AsyncStorage);
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(A)));
  await auth.hydrate();
  expect(auth.getSnapshot().session?.ownerId).toBe('a');
  expect(await authSessionStore.read()).toEqual(A);
});

it('clears persisted credentials when remember-me is disabled', async () => {
  await authSessionStore.replace(A);
  auth.dispose();
  auth = createAuthSessionController(AsyncStorage);
  await auth.hydrate();
  expect(auth.getSnapshot()).toMatchObject({
    session: null,
    isHydratingAuth: false,
    isAuthenticated: false,
  });
  expect(await authSessionStore.read()).toEqual({
    accessToken: null,
    refreshToken: null,
  });
});

it.each([
  'mismatch',
  'malformed',
  'missing credentials',
  'storage failure',
  'refresh failure',
])('rejects invalid hydration: %s', async (scenario) => {
  if (scenario !== 'missing credentials')
    await authSessionStore.replace(
      scenario === 'refresh failure' ? tokens('a', 1) : A,
    );
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.rememberMe, 'true');
  if (scenario === 'mismatch')
    await AsyncStorage.setItem(
      AUTH_STORAGE_KEYS.userProfile,
      JSON.stringify(PROFILE_B),
    );
  if (scenario === 'malformed')
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.userProfile, '{');
  if (scenario === 'storage failure')
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('read failed'));
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  auth.dispose();
  auth = createAuthSessionController(AsyncStorage);
  await expect(auth.hydrate()).rejects.toBeDefined();
  expect(auth.getSnapshot()).toMatchObject({
    session: null,
    currentUser: null,
    isHydratingAuth: false,
    isAuthenticated: false,
  });
  expect(await authSessionStore.read()).toEqual({
    accessToken: null,
    refreshToken: null,
  });
});

it('cannot overwrite B when hydration completes after a login starts', async () => {
  await authSessionStore.replace(A);
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.rememberMe, 'true');
  const profile = Promise.withResolvers<string | null>();
  const reading = Promise.withResolvers<void>();
  const original = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
  jest.spyOn(AsyncStorage, 'getItem').mockImplementation((key) => {
    if (key === AUTH_STORAGE_KEYS.userProfile) {
      reading.resolve();
      return profile.promise;
    }
    return original(key);
  });
  auth.dispose();
  auth = createAuthSessionController(AsyncStorage);
  const hydration = auth.hydrate();
  const rejected = expect(hydration).rejects.toMatchObject({
    name: 'AbortError',
  });
  await reading.promise;
  const login = auth.signIn({
    rememberMe: true,
    tokens: B,
    userProfile: PROFILE_B,
  });
  profile.resolve(JSON.stringify(PROFILE_A));
  await rejected;
  await login;
  expect(auth.getSnapshot()).toMatchObject({
    currentUser: PROFILE_B,
    session: { ownerId: 'b' },
  });
  expect(await authSessionStore.read()).toEqual(B);
});

it('notifies subscribers when failed refresh clears the current session', async () => {
  await auth.signIn({ rememberMe: true, tokens: A });
  const session = auth.getSnapshot().session!;
  const listener = jest.fn();
  const unsubscribe = auth.subscribe(listener);
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response('', { status: 401 }))
    .mockResolvedValueOnce(new Response('', { status: 401 }));
  await expect(
    session.request({
      input: 'https://api.test/me',
      parse: async (response) => response.text(),
    }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(listener).toHaveBeenCalled();
  expect(auth.getSnapshot()).toMatchObject({
    session: null,
    currentUser: null,
    isAuthenticated: false,
  });
  unsubscribe();
});

it('cannot clear a login initiated synchronously by the previous session abort', async () => {
  await auth.signIn({ rememberMe: true, tokens: A, userProfile: PROFILE_A });
  let replacement: Promise<void> | undefined;
  auth.getSnapshot().session!.signal.addEventListener(
    'abort',
    () => {
      replacement = auth.signIn({
        rememberMe: true,
        tokens: B,
        userProfile: PROFILE_B,
      });
    },
    { once: true },
  );
  await auth.signOut();
  await replacement;
  expect(auth.getSnapshot().session?.ownerId).toBe('b');
  expect(
    JSON.parse((await AsyncStorage.getItem(AUTH_STORAGE_KEYS.userProfile))!),
  ).toEqual(PROFILE_B);
});

it('cannot overwrite a new login after hydration refresh body parsing', async () => {
  await authSessionStore.replace(tokens('a', 1));
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.rememberMe, 'true');
  const parsed = Promise.withResolvers<typeof A>();
  const parsing = Promise.withResolvers<void>();
  const response = new Response();
  jest.spyOn(response, 'json').mockImplementation(() => {
    parsing.resolve();
    return parsed.promise;
  });
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
  auth.dispose();
  auth = createAuthSessionController(AsyncStorage);
  const hydration = auth.hydrate();
  const rejected = expect(hydration).rejects.toMatchObject({
    name: 'AbortError',
  });
  await parsing.promise;
  const login = auth.signIn({
    rememberMe: true,
    tokens: B,
    userProfile: PROFILE_B,
  });
  await login;
  expect(auth.getSnapshot().session?.ownerId).toBe('b');
  parsed.resolve(A);
  await rejected;
  expect(auth.getSnapshot()).toMatchObject({
    session: { ownerId: 'b' },
    currentUser: PROFILE_B,
  });
  expect(await authSessionStore.read()).toEqual(B);
});
