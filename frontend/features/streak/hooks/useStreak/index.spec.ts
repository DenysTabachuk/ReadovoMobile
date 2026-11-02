import {
  type MutationObserverOptions,
  QueryClient,
  type QueryObserverOptions,
} from '@tanstack/react-query';

import { getStreakProfile } from '../../api/requests/getStreakProfile';
import { applyStreakFreeze } from '../../api/requests/applyStreakFreeze';
import { purchaseStreakFreezeToken } from '../../api/requests/purchaseStreakFreezeToken';
import { restoreBrokenStreak } from '../../api/requests/restoreBrokenStreak';
import type { StreakState } from '../../types';
import { useStreak } from '.';

const mockClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const mockShowBanner = jest.fn();
const mockUnsubscribers: (() => void)[] = [];

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => ({
  api: jest.fn(),
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../api/requests/applyStreakFreeze', () => ({
  applyStreakFreeze: jest.fn(),
}));
jest.mock('../../api/requests/purchaseStreakFreezeToken', () => ({
  purchaseStreakFreezeToken: jest.fn(),
}));
jest.mock('../../api/requests/restoreBrokenStreak', () => ({
  restoreBrokenStreak: jest.fn(),
}));
jest.mock('../../api/requests/getStreakProfile', () => ({
  getStreakProfile: jest.fn(),
}));
// Replace React bindings only; real observers execute callbacks and cache updates.
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQueryClient: () => mockClient,
    useQuery: (options: QueryObserverOptions<StreakState>) => {
      const observer = new actual.QueryObserver(mockClient, options);
      return {
        ...observer.getCurrentResult(),
        refetch: observer.refetch.bind(observer),
      };
    },
    useMutation: (
      options: MutationObserverOptions<StreakState, Error, unknown>,
    ) => {
      const observer = new actual.MutationObserver(mockClient, options);
      mockUnsubscribers.push(observer.subscribe(() => undefined));
      return { mutateAsync: observer.mutate.bind(observer) };
    },
  };
});

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
const UPDATED: StreakState = {
  ...INITIAL,
  currentStreak: 3,
  todayStatus: 'completed',
  claimedStreakAchievements: [
    { milestone: 3, rewardCoins: 5, isUnlocked: true, claimedAt: '2026-07-09' },
    {
      milestone: 7,
      rewardCoins: 10,
      isUnlocked: true,
      claimedAt: '2026-07-09',
    },
  ],
};

beforeEach(() => {
  jest.resetAllMocks();
  mockClient.setQueryData(['streak-profile', 'reader-a'], INITIAL);
  mockClient.setQueryData(['streak-profile', 'reader-b'], INITIAL);
  for (const owner of ['reader-a', 'reader-b']) {
    mockClient.setQueryData(['achievements-profile', owner], {});
    for (const month of [6, 7]) {
      mockClient.setQueryData(
        ['streak-calendar-month', owner, 2026, month],
        {},
      );
    }
  }
  jest.mocked(getStreakProfile).mockResolvedValue(INITIAL);
  jest.mocked(restoreBrokenStreak).mockResolvedValue(UPDATED);
  jest.mocked(applyStreakFreeze).mockResolvedValue(UPDATED);
  jest.mocked(purchaseStreakFreezeToken).mockResolvedValue(UPDATED);
});

afterEach(() => {
  for (const unsubscribe of mockUnsubscribers.splice(0)) unsubscribe();
  mockClient.clear();
});

describe('streak profile query', () => {
  it('fetches the profile without submitting offline activity writes', async () => {
    const { streakQuery } = useStreak('reader-a');
    expect((await streakQuery.refetch()).data).toEqual(INITIAL);
    expect(getStreakProfile).toHaveBeenCalledTimes(1);
    expect(mockShowBanner).not.toHaveBeenCalled();
  });

  it('preserves profile failures without replacing cached data', async () => {
    const error = new Error('Request failed');
    jest.mocked(getStreakProfile).mockRejectedValue(error);
    const { streakQuery } = useStreak('reader-a');
    expect((await streakQuery.refetch()).error).toBe(error);
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toBe(
      INITIAL,
    );
  });
});

describe('streak mutation cache contracts', () => {
  it.each(['restore', 'freeze'] as const)(
    '%s updates only its owner without presenting UI feedback',
    async (operation) => {
      const streak = useStreak('reader-a');
      const run = () =>
        operation === 'restore'
          ? streak.restoreMutation.mutateAsync()
          : streak.applyFreezeMutation.mutateAsync('2026-07-08');
      await run();
      expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toEqual(
        UPDATED,
      );
      expect(mockClient.getQueryData(['streak-profile', 'reader-b'])).toBe(
        INITIAL,
      );
      expect(
        mockClient.getQueryState(['achievements-profile', 'reader-a'])
          ?.isInvalidated,
      ).toBe(true);
      expect(
        mockClient.getQueryState(['achievements-profile', 'reader-b'])
          ?.isInvalidated,
      ).toBe(false);
      expect(mockShowBanner).not.toHaveBeenCalled();
      expect(
        mockClient.getQueryState(['streak-calendar-month', 'reader-a', 2026, 6])
          ?.isInvalidated,
      ).toBe(true);
      expect(
        mockClient.getQueryState(['streak-calendar-month', 'reader-a', 2026, 7])
          ?.isInvalidated,
      ).toBe(true);
      expect(
        mockClient.getQueryState(['streak-calendar-month', 'reader-b', 2026, 7])
          ?.isInvalidated,
      ).toBe(false);
      await run();
      expect(mockShowBanner).not.toHaveBeenCalled();
    },
  );

  it('invalidates restored calendars after the screen observer unsubscribes', async () => {
    const requestStarted = Promise.withResolvers<void>();
    const response = Promise.withResolvers<StreakState>();
    jest.mocked(restoreBrokenStreak).mockImplementationOnce(() => {
      requestStarted.resolve();
      return response.promise;
    });
    const { restoreMutation } = useStreak('reader-a');
    const onSuccess = jest.fn();
    const pending = restoreMutation.mutateAsync(undefined, { onSuccess });

    await requestStarted.promise;
    for (const unsubscribe of mockUnsubscribers.splice(0)) unsubscribe();
    response.resolve(UPDATED);
    await pending;

    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toEqual(
      UPDATED,
    );
    for (const month of [6, 7]) {
      expect(
        mockClient.getQueryState([
          'streak-calendar-month',
          'reader-a',
          2026,
          month,
        ])?.isInvalidated,
      ).toBe(true);
      expect(
        mockClient.getQueryState([
          'streak-calendar-month',
          'reader-b',
          2026,
          month,
        ])?.isInvalidated,
      ).toBe(false);
    }
  });

  it('calls restore and passes the missed date key to freeze', async () => {
    const streak = useStreak('reader-a');
    await streak.restoreMutation.mutateAsync();
    await streak.applyFreezeMutation.mutateAsync('2026-07-08');
    expect(restoreBrokenStreak).toHaveBeenCalledTimes(1);
    expect(applyStreakFreeze).toHaveBeenCalledWith({ date: '2026-07-08' });
  });

  it('updates a profile without unlocked milestones without invalidating achievements', async () => {
    jest
      .mocked(restoreBrokenStreak)
      .mockResolvedValue({ ...INITIAL, currentStreak: 1 });
    await useStreak('reader-a').restoreMutation.mutateAsync();
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toEqual({
      ...INITIAL,
      currentStreak: 1,
    });
    expect(
      mockClient.getQueryState(['achievements-profile', 'reader-a'])
        ?.isInvalidated,
    ).toBe(false);
    expect(mockShowBanner).not.toHaveBeenCalled();
  });

  it('compares against an empty achievement list when there is no cached profile', async () => {
    mockClient.removeQueries({ queryKey: ['streak-profile', 'reader-a'] });
    const streak = useStreak('reader-a');
    await streak.restoreMutation.mutateAsync();
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toEqual(
      UPDATED,
    );
    expect(mockShowBanner).not.toHaveBeenCalled();
  });

  it('always invalidates achievements after purchase, without a banner or calendar invalidation', async () => {
    const streak = useStreak('reader-a');
    await streak.purchaseFreezeTokenMutation.mutateAsync();
    expect(purchaseStreakFreezeToken).toHaveBeenCalledTimes(1);
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toEqual(
      UPDATED,
    );
    expect(
      mockClient.getQueryState(['achievements-profile', 'reader-a'])
        ?.isInvalidated,
    ).toBe(true);
    expect(mockShowBanner).not.toHaveBeenCalled();
    expect(
      mockClient.getQueryState(['streak-calendar-month', 'reader-a', 2026, 7])
        ?.isInvalidated,
    ).toBe(false);
    await mockClient.resetQueries({
      queryKey: ['achievements-profile', 'reader-a'],
    });
    jest.mocked(purchaseStreakFreezeToken).mockResolvedValue(INITIAL);
    await streak.purchaseFreezeTokenMutation.mutateAsync();
    expect(
      mockClient.getQueryState(['achievements-profile', 'reader-a'])
        ?.isInvalidated,
    ).toBe(true);
  });

  it('leaves all caches intact when requests reject', async () => {
    const error = new Error('Request failed');
    jest.mocked(restoreBrokenStreak).mockRejectedValue(error);
    jest.mocked(applyStreakFreeze).mockRejectedValue(error);
    jest.mocked(purchaseStreakFreezeToken).mockRejectedValue(error);
    const streak = useStreak('reader-a');
    await expect(streak.restoreMutation.mutateAsync()).rejects.toBe(error);
    await expect(
      streak.applyFreezeMutation.mutateAsync('2026-07-08'),
    ).rejects.toBe(error);
    await expect(streak.purchaseFreezeTokenMutation.mutateAsync()).rejects.toBe(
      error,
    );
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toBe(
      INITIAL,
    );
    expect(
      mockClient.getQueryState(['achievements-profile', 'reader-a'])
        ?.isInvalidated,
    ).toBe(false);
    expect(
      mockClient.getQueryState(['streak-calendar-month', 'reader-a', 2026, 7])
        ?.isInvalidated,
    ).toBe(false);
    expect(mockShowBanner).not.toHaveBeenCalled();
  });
});
