import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, type QueryObserverOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { api } from '@/features/auth/session/api';
import * as auth from '@/features/auth';
import { cancelQueriesOnSessionChange } from '@/features/auth/providers/authProvider/utils/cancelQueriesOnSessionChange';
import { authSessionStore } from '@/features/auth/session/authTokenStorage/authSessionStore';
import { useStreakCalendarMonthQuery } from '@/features/streak/api/queries/useStreakCalendarMonthQuery';
import { useStreakProfileQuery } from '@/features/streak/api/queries/useStreakProfileQuery';
import * as streakProfileRequest from '@/features/streak/api/requests/getStreakProfile';
import { buyStreakFreezeToken } from '@/features/streak/utils/buyStreakFreezeToken';
import { shouldRetryQuery } from '@/providers/queryProvider/utils/shouldRetryQuery';

// Keep the actual services, Axios interceptors, token store, and query observers.
// Only replace React bindings, native storage, and the network adapter.
jest.mock('@/api', () => ({
  API_BASE_URL: 'https://api.example.test',
  HTTP_STATUS: { unauthorized: 401 },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('@/features/auth', () => ({
  __esModule: true,
  ...jest.requireActual<typeof import('@/features/auth/session')>(
    '@/features/auth/session',
  ),
  useAuth: () => ({ currentUser: { id: 'reader-a' } }),
}));
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQuery: <TData>(options: QueryObserverOptions<TData>) => {
      const observer = new actual.QueryObserver(mockClient, options);
      return {
        ...observer.getCurrentResult(),
        refetch: observer.refetch.bind(observer),
      };
    },
  };
});

const mockClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 1000 } },
});
const values = new Map<string, string>();
let unsubscribeSession: (() => void) | undefined;
const ACCOUNT_A = {
  accessToken: `header.${btoa(JSON.stringify({ sub: 'reader-a' }))}.sig`,
  refreshToken: 'refresh-a',
};
const ACCOUNT_B = {
  accessToken: `header.${btoa(JSON.stringify({ sub: 'reader-b' }))}.sig`,
  refreshToken: 'refresh-b',
};

beforeEach(async () => {
  jest.useFakeTimers();
  values.clear();
  jest
    .mocked(AsyncStorage.getItem)
    .mockImplementation(async (key) => values.get(key) ?? null);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    values.set(key, value);
  });
  jest.mocked(AsyncStorage.removeItem).mockImplementation(async (key) => {
    values.delete(key);
  });
  await authSessionStore.replace(ACCOUNT_A);
  unsubscribeSession = cancelQueriesOnSessionChange(mockClient);
});

afterEach(() => {
  unsubscribeSession?.();
  mockClient.clear();
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.useRealTimers();
});

it('rejects a stale service before sending a purchase after snapshot capture', async () => {
  const capture = auth.getAuthSessionSnapshot;
  jest
    .spyOn(auth, 'getAuthSessionSnapshot')
    .mockImplementationOnce(async (userId) => {
      const session = await capture(userId);
      await authSessionStore.replace(ACCOUNT_B);
      return session;
    });
  const adapter = mockHttpAdapter(api).mockResolvedValue(
    createHttpResponse({}),
  );

  await expect(buyStreakFreezeToken('reader-a')).rejects.toMatchObject({
    name: 'AbortError',
  });

  expect(adapter).not.toHaveBeenCalled();
});

it('discards a canceled profile query even if its final request has already succeeded', async () => {
  const getProfile = streakProfileRequest.getStreakProfile;
  jest
    .spyOn(streakProfileRequest, 'getStreakProfile')
    .mockImplementationOnce(async () => {
      const profile = await getProfile();
      await authSessionStore.replace(ACCOUNT_B);
      return profile;
    });
  const adapter = mockHttpAdapter(api).mockResolvedValue(
    createHttpResponse({ currentStreak: 7 }),
  );
  const pending = useStreakProfileQuery('reader-a').refetch({
    throwOnError: true,
  });

  await expect(pending).rejects.toMatchObject({ revert: true });

  expect(adapter).toHaveBeenCalledTimes(1);
  expect(
    mockClient.getQueryData(['streak-profile', 'reader-a']),
  ).toBeUndefined();
});

it.each([
  { name: 'another account', tokens: ACCOUNT_B },
  { name: 'the same account signing in again', tokens: ACCOUNT_A },
  { name: 'logout', tokens: null },
])('cancels a scheduled calendar retry after $name', async ({ tokens }) => {
  const failed = Promise.withResolvers<void>();
  const unsubscribe = mockClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'failed')
      failed.resolve();
  });
  const adapter = mockHttpAdapter(api)
    .mockImplementationOnce(async (config) => {
      throw new AxiosError('Offline', AxiosError.ERR_NETWORK, config);
    })
    .mockResolvedValue(createHttpResponse({ days: ['B-private-calendar'] }));
  const query = useStreakCalendarMonthQuery({ year: 2026, month: 7 });
  const outcome = query.refetch({ throwOnError: true }).then(
    (result) => ({ data: result.data }),
    (error: unknown) => ({ error }),
  );

  await failed.promise;
  if (tokens) await authSessionStore.replace(tokens);
  else await authSessionStore.clear();
  await jest.advanceTimersByTimeAsync(1000);
  unsubscribe();

  expect(
    adapter.mock.calls.map(([config]) => config.headers.get('Authorization')),
  ).toEqual([`Bearer ${ACCOUNT_A.accessToken}`]);
  expect(
    mockClient.getQueryData(['streak-calendar-month', 'reader-a', 2026, 7]),
  ).toBeUndefined();
  await expect(outcome).resolves.toHaveProperty('error');
});

it('still retries an ordinary calendar failure while A stays signed in', async () => {
  const failed = Promise.withResolvers<void>();
  const unsubscribe = mockClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'failed')
      failed.resolve();
  });
  const calendar = { days: [], month: 7, year: 2026 };
  const adapter = mockHttpAdapter(api)
    .mockImplementationOnce(async (config) => {
      throw new AxiosError('Offline', AxiosError.ERR_NETWORK, config);
    })
    .mockResolvedValue(createHttpResponse(calendar));
  const pending = useStreakCalendarMonthQuery({ year: 2026, month: 7 }).refetch(
    { throwOnError: true },
  );

  await failed.promise;
  await jest.advanceTimersByTimeAsync(1000);
  unsubscribe();

  await expect(pending).resolves.toMatchObject({ data: calendar });
  expect(
    adapter.mock.calls.map(([config]) => config.headers.get('Authorization')),
  ).toEqual([
    `Bearer ${ACCOUNT_A.accessToken}`,
    `Bearer ${ACCOUNT_A.accessToken}`,
  ]);
});
