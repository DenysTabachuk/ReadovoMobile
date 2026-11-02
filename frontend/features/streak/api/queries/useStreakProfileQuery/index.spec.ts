import { QueryClient, type QueryObserverOptions } from '@tanstack/react-query';
import { getStreakProfile } from '../../requests/getStreakProfile';
import type { StreakState } from '../../../types';
import { useStreakProfileQuery } from '.';

jest.mock('@/features/auth', () => ({
  api: jest.fn(),
  useAuthenticatedUser: () => ({ id: mockUserId }),
}));
jest.mock('../../requests/getStreakProfile', () => ({
  getStreakProfile: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQuery: (options: QueryObserverOptions<StreakState>) => {
      const observer = new actual.QueryObserver(mockClient, options);
      return {
        ...observer.getCurrentResult(),
        refetch: observer.refetch.bind(observer),
      };
    },
  };
});

const mockClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
let mockUserId = 'reader-a';
const INITIAL: StreakState = {
  activityHistory: [],
  brokenStreakInfo: null,
  claimedStreakAchievements: [],
  coinBalance: 100,
  currentStreak: 2,
  restorePrice: 100,

  freezeTokenPrice: 100,

  freezeTokens: 1,
  lastActivityDate: '2026-07-08',
  longestStreak: 2,
  nextBonusInDays: 1,
  nextMilestone: 3,
  serverNow: '2026-07-09T12:00:00Z',
  todayStatus: 'pending',
};

beforeEach(() => {
  mockUserId = 'reader-a';
  jest.resetAllMocks();
  mockClient.setQueryData(['streak-profile', 'reader-a'], INITIAL);
  jest.mocked(getStreakProfile).mockResolvedValue(INITIAL);
});
afterEach(() => mockClient.clear());

it('fetches the current profile and keeps its account cache key', async () => {
  expect((await useStreakProfileQuery().refetch()).data).toEqual(INITIAL);
  expect(getStreakProfile).toHaveBeenCalledTimes(1);
  expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toEqual(
    INITIAL,
  );
});

it('preserves cached data when the profile request fails', async () => {
  const error = new Error('Request failed');
  jest.mocked(getStreakProfile).mockRejectedValue(error);
  expect((await useStreakProfileQuery().refetch()).error).toBe(error);
  expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toBe(INITIAL);
});

it('selects another account cache from the authenticated context', () => {
  const accountBProfile = { ...INITIAL, currentStreak: 8 };
  mockClient.setQueryData(['streak-profile', 'reader-b'], accountBProfile);
  mockUserId = 'reader-b';
  expect(useStreakProfileQuery().data).toBe(accountBProfile);
  expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toBe(INITIAL);
});
