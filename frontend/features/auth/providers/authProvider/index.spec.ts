import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AuthProvider, useAuth, useAuthenticatedUser } from '.';
import { AUTH_STORAGE_KEYS } from './constants';
import { authSessionStore } from '../../session/authTokenStorage/authSessionStore';
import { refreshAuthSession } from '../../session/refreshAuthSession';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('../../session/refreshAuthSession', () => ({
  refreshAuthSession: jest.fn(),
}));
jest.mock('../../googleAuth', () => ({ signOutFromGoogle: jest.fn() }));

const USER = {
  id: 'reader-a',
  email: 'reader@example.test',
  displayName: null,
};
const TOKENS = {
  accessToken: `header.${btoa(JSON.stringify({ exp: 4102444800 }))}.sig`,
  refreshToken: 'refresh-a',
};
const values = new Map<string, string>();
let renderer: ReactTestRenderer;
let client: QueryClient;
let latestAuth: ReturnType<typeof useAuth> | undefined;
let observedPrivateId: string | undefined;

function PrivateScreen() {
  observedPrivateId = useAuthenticatedUser().id;
  return null;
}

function Probe() {
  latestAuth = useAuth();
  if (latestAuth.isHydratingAuth || !latestAuth.isAuthenticated) return null;
  return createElement(PrivateScreen);
}

function auth() {
  if (!latestAuth) throw new Error('Auth probe has not mounted.');
  return latestAuth;
}

async function mount() {
  await act(async () => {
    renderer = create(
      createElement(
        QueryClientProvider,
        { client },
        createElement(AuthProvider, null, createElement(Probe)),
      ),
    );
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  // React 19 deprecates this renderer, but still supports effect/unmount testing.
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  values.clear();
  latestAuth = undefined;
  observedPrivateId = undefined;
  client = new QueryClient();
  jest
    .mocked(AsyncStorage.getItem)
    .mockImplementation(async (key) => values.get(key) ?? null);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    values.set(key, value);
  });
  jest.mocked(AsyncStorage.removeItem).mockImplementation(async (key) => {
    values.delete(key);
  });
  jest.mocked(refreshAuthSession).mockReset();
});

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
  });
  client.clear();
  jest.restoreAllMocks();
});

it('keeps hydration pending without exposing a user, then restores a valid profile', async () => {
  values.set(AUTH_STORAGE_KEYS.rememberMe, 'true');
  values.set(AUTH_STORAGE_KEYS.accessToken, TOKENS.accessToken);
  let releaseProfile: (value: string) => void = () => {
    throw new Error('Storage not read');
  };
  const profileRead = new Promise<string>((resolve) => {
    releaseProfile = resolve;
  });
  jest
    .mocked(AsyncStorage.getItem)
    .mockImplementation(async (key) =>
      key === AUTH_STORAGE_KEYS.userProfile
        ? profileRead
        : (values.get(key) ?? null),
    );
  await mount();
  expect(auth().isHydratingAuth).toBe(true);
  expect(observedPrivateId).toBeUndefined();
  await act(async () => {
    releaseProfile(JSON.stringify(USER));
  });
  expect(auth()).toMatchObject({
    isHydratingAuth: false,
    isAuthenticated: true,
    currentUser: USER,
  });
  expect(observedPrivateId).toBe('reader-a');
  expect(refreshAuthSession).not.toHaveBeenCalled();
});

it.each([
  '{invalid',
  'null',
  '{"id":null}',
  '{"id":"","email":null,"displayName":null}',
])(
  'rejects unusable stored profile %s even with a valid token',
  async (profile) => {
    values.set(AUTH_STORAGE_KEYS.rememberMe, 'true');
    values.set(AUTH_STORAGE_KEYS.accessToken, TOKENS.accessToken);
    values.set(AUTH_STORAGE_KEYS.userProfile, profile);
    await mount();
    expect(auth()).toMatchObject({
      isHydratingAuth: false,
      isAuthenticated: false,
      currentUser: null,
    });
    expect(values.has(AUTH_STORAGE_KEYS.accessToken)).toBe(false);
    expect(observedPrivateId).toBeUndefined();
  },
);

it('refreshes expired stored tokens before exposing the restored user', async () => {
  values.set(AUTH_STORAGE_KEYS.rememberMe, 'true');
  values.set(AUTH_STORAGE_KEYS.accessToken, 'expired');
  values.set(AUTH_STORAGE_KEYS.refreshToken, TOKENS.refreshToken);
  values.set(AUTH_STORAGE_KEYS.userProfile, JSON.stringify(USER));
  jest.mocked(refreshAuthSession).mockResolvedValue(TOKENS);
  await mount();
  expect(refreshAuthSession).toHaveBeenCalledTimes(1);
  expect(auth().currentUser).toEqual(USER);
});

it('handles login, token rotation, expiry, and another login to the same account', async () => {
  await mount();
  await act(async () => {
    await auth().signIn({ rememberMe: true, ...TOKENS, userProfile: USER });
  });
  const version = auth().sessionVersion;
  expect(auth().currentUser).toEqual(USER);
  await act(async () => {
    await authSessionStore.commitRefresh({ version, tokens: TOKENS });
  });
  expect(auth().sessionVersion).toBe(version);
  expect(auth().currentUser).toEqual(USER);
  await act(async () => {
    await authSessionStore.clearIfCurrent(version);
  });
  expect(auth()).toMatchObject({ isAuthenticated: false, currentUser: null });
  await act(async () => {
    await auth().signIn({ rememberMe: false, ...TOKENS, userProfile: USER });
  });
  expect(auth().currentUser).toEqual(USER);
  expect(auth().sessionVersion).toBeGreaterThan(version);
  expect(values.has(AUTH_STORAGE_KEYS.userProfile)).toBe(false);
  await act(async () => {
    await auth().signOut();
  });
  expect(auth().isAuthenticated).toBe(false);
  await act(async () => {
    await auth().signIn({
      rememberMe: false,
      ...TOKENS,
      userProfile: { ...USER, id: 'reader-b' },
    });
  });
  expect(auth().currentUser?.id).toBe('reader-b');
});

it('does not restore a session when remember-me is disabled', async () => {
  values.set(AUTH_STORAGE_KEYS.accessToken, TOKENS.accessToken);
  values.set(AUTH_STORAGE_KEYS.userProfile, JSON.stringify(USER));
  await mount();
  expect(auth().isAuthenticated).toBe(false);
  expect(values.has(AUTH_STORAGE_KEYS.accessToken)).toBe(false);
});

it('finishes hydration signed out when refresh rejects the persisted session', async () => {
  values.set(AUTH_STORAGE_KEYS.rememberMe, 'true');
  values.set(AUTH_STORAGE_KEYS.accessToken, 'expired');
  values.set(AUTH_STORAGE_KEYS.refreshToken, TOKENS.refreshToken);
  values.set(AUTH_STORAGE_KEYS.userProfile, JSON.stringify(USER));
  jest.mocked(refreshAuthSession).mockImplementation(async () => {
    await authSessionStore.clearIfCurrent(authSessionStore.version);
    return null;
  });
  await mount();
  expect(auth()).toMatchObject({
    isHydratingAuth: false,
    isAuthenticated: false,
    currentUser: null,
  });
  expect(observedPrivateId).toBeUndefined();
});

it('keeps stored tokens for a later attempt after a transient hydration refresh failure', async () => {
  values.set(AUTH_STORAGE_KEYS.rememberMe, 'true');
  values.set(AUTH_STORAGE_KEYS.accessToken, 'expired');
  values.set(AUTH_STORAGE_KEYS.refreshToken, TOKENS.refreshToken);
  values.set(AUTH_STORAGE_KEYS.userProfile, JSON.stringify(USER));
  jest
    .mocked(refreshAuthSession)
    .mockRejectedValue(new Error('Network unavailable'));
  await mount();
  expect(auth()).toMatchObject({
    isHydratingAuth: false,
    isAuthenticated: false,
  });
  expect(values.get(AUTH_STORAGE_KEYS.refreshToken)).toBe('refresh-a');
});
