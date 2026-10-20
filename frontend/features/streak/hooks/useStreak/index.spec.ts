import {
  type MutationObserverOptions,
  QueryClient,
  type QueryObserver,
  type QueryObserverOptions,
} from '@tanstack/react-query';

import { getStreakProfile } from '../../api/requests/getStreakProfile';
import { applyFreezeToMissedDay } from '../../utils/applyFreezeToMissedDay';
import { buyStreakFreezeToken } from '../../utils/buyStreakFreezeToken';
import { restoreStreakForCoins } from '../../utils/restoreStreakForCoins';
import { syncPendingStreakEvents } from '../../utils/syncPendingStreakEvents';
import { trackLearningActivity } from '../../utils/trackLearningActivity';
import type { StreakState } from '../../types';
import { useStreak } from '.';
import { getAuthSessionSnapshot } from '@/features/auth';

const mockClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const mockShowBanner = jest.fn();
let mockProfileObserver: QueryObserver<StreakState>;

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => ({
  authenticatedFetch: jest.fn(),
  useAuth: jest.fn(),
  getAuthSessionSnapshot: jest.fn(),
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../utils/applyFreezeToMissedDay', () => ({
  applyFreezeToMissedDay: jest.fn(),
}));
jest.mock('../../utils/buyStreakFreezeToken', () => ({
  buyStreakFreezeToken: jest.fn(),
}));
jest.mock('../../utils/restoreStreakForCoins', () => ({
  restoreStreakForCoins: jest.fn(),
}));
jest.mock('../../utils/syncPendingStreakEvents', () => ({
  syncPendingStreakEvents: jest.fn(),
}));
jest.mock('../../utils/trackLearningActivity', () => ({
  trackLearningActivity: jest.fn(),
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
      mockProfileObserver = new actual.QueryObserver(mockClient, options);
      return {
        ...mockProfileObserver.getCurrentResult(),
        refetch: mockProfileObserver.refetch.bind(mockProfileObserver),
      };
    },
    useMutation: (
      options: MutationObserverOptions<StreakState, Error, unknown>,
    ) => {
      const observer = new actual.MutationObserver(mockClient, options);
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
  jest
    .mocked(getAuthSessionSnapshot)
    .mockResolvedValue({ assertCurrent: jest.fn() });
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
  jest.mocked(syncPendingStreakEvents).mockResolvedValue();
  jest.mocked(trackLearningActivity).mockResolvedValue(UPDATED);
  jest.mocked(restoreStreakForCoins).mockResolvedValue(UPDATED);
  jest.mocked(applyFreezeToMissedDay).mockResolvedValue(UPDATED);
  jest.mocked(buyStreakFreezeToken).mockResolvedValue(UPDATED);
});

afterEach(() => mockClient.clear());

describe('streak profile query', () => {
  it('waits for offline synchronization before fetching and caching the profile', async () => {
    let finishSync!: () => void;
    jest.mocked(syncPendingStreakEvents).mockReturnValue(
      new Promise<void>((resolve) => {
        finishSync = resolve;
      }),
    );
    const { streakQuery } = useStreak('reader-a');
    const pending = streakQuery.refetch();
    await Promise.resolve();
    expect(syncPendingStreakEvents).toHaveBeenCalledWith('reader-a');
    expect(getStreakProfile).not.toHaveBeenCalled();
    finishSync();
    expect((await pending).data).toEqual(INITIAL);
    expect(getStreakProfile).toHaveBeenCalledWith();
    expect(mockShowBanner).not.toHaveBeenCalled();
  });

  it('does not fetch automatically without an owner and rejects manual refetch', async () => {
    const { streakQuery } = useStreak();
    const unsubscribe = mockProfileObserver.subscribe(() => undefined);
    expect(mockProfileObserver.getCurrentResult().fetchStatus).toBe('idle');
    expect((await streakQuery.refetch()).error?.message).toBe(
      'Missing user id',
    );
    expect(syncPendingStreakEvents).not.toHaveBeenCalled();
    expect(getStreakProfile).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('preserves sync failures and skips the profile request', async () => {
    const error = new Error('Storage failed');
    jest.mocked(syncPendingStreakEvents).mockRejectedValue(error);
    const { streakQuery } = useStreak('reader-a');
    expect((await streakQuery.refetch()).error).toBe(error);
    expect(getStreakProfile).not.toHaveBeenCalled();
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toBe(
      INITIAL,
    );
  });
});

describe('streak mutation cache and notification contracts', () => {
  it.each(['activity', 'restore', 'freeze'] as const)(
    '%s updates only its owner and notifies the first new milestone once',
    async (operation) => {
      const streak = useStreak('reader-a');
      const run = () =>
        operation === 'activity'
          ? streak.completeActivityMutation.mutateAsync(
              'article_quiz_completed',
            )
          : operation === 'restore'
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
      expect(mockShowBanner).toHaveBeenCalledTimes(1);
      expect(mockShowBanner).toHaveBeenCalledWith({
        achievement: { coinsReward: 5, icon: 'trophy' },
        description: 'streak.achievements.3.description',
        title: 'streak.achievements.3.title',
        variant: 'achievement',
      });
      expect(
        mockClient.getQueryState(['streak-calendar-month', 'reader-a', 2026, 6])
          ?.isInvalidated,
      ).toBe(operation === 'freeze');
      expect(
        mockClient.getQueryState(['streak-calendar-month', 'reader-a', 2026, 7])
          ?.isInvalidated,
      ).toBe(operation === 'freeze');
      expect(
        mockClient.getQueryState(['streak-calendar-month', 'reader-b', 2026, 7])
          ?.isInvalidated,
      ).toBe(false);
      await run();
      expect(mockShowBanner).toHaveBeenCalledTimes(1);
    },
  );

  it('passes activity type and freeze date to their existing services', async () => {
    const streak = useStreak('reader-a');
    await streak.completeActivityMutation.mutateAsync('lexical_test_completed');
    await streak.restoreMutation.mutateAsync();
    await streak.applyFreezeMutation.mutateAsync('2026-07-08');
    expect(trackLearningActivity).toHaveBeenCalledWith(
      'reader-a',
      'lexical_test_completed',
    );
    expect(restoreStreakForCoins).toHaveBeenCalledWith('reader-a');
    expect(applyFreezeToMissedDay).toHaveBeenCalledWith(
      'reader-a',
      '2026-07-08',
    );
  });

  it('updates a profile without unlocked milestones without invalidating achievements', async () => {
    jest
      .mocked(restoreStreakForCoins)
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
    await useStreak('reader-a').restoreMutation.mutateAsync();
    expect(mockClient.getQueryData(['streak-profile', 'reader-a'])).toEqual(
      UPDATED,
    );
    expect(mockShowBanner).toHaveBeenCalledTimes(1);
  });

  it('always invalidates achievements after purchase, without a banner or calendar invalidation', async () => {
    const streak = useStreak('reader-a');
    await streak.purchaseFreezeTokenMutation.mutateAsync();
    expect(buyStreakFreezeToken).toHaveBeenCalledWith('reader-a');
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
    jest.mocked(buyStreakFreezeToken).mockResolvedValue(INITIAL);
    await streak.purchaseFreezeTokenMutation.mutateAsync();
    expect(
      mockClient.getQueryState(['achievements-profile', 'reader-a'])
        ?.isInvalidated,
    ).toBe(true);
  });

  it('leaves all caches intact when services reject', async () => {
    const error = new Error('Request failed');
    jest.mocked(trackLearningActivity).mockRejectedValue(error);
    jest.mocked(restoreStreakForCoins).mockRejectedValue(error);
    jest.mocked(applyFreezeToMissedDay).mockRejectedValue(error);
    jest.mocked(buyStreakFreezeToken).mockRejectedValue(error);
    const streak = useStreak('reader-a');
    await expect(
      streak.completeActivityMutation.mutateAsync('article_quiz_completed'),
    ).rejects.toBe(error);
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

  it('rejects every mutation without an owner before calling services', async () => {
    const streak = useStreak();
    await expect(
      streak.completeActivityMutation.mutateAsync('article_quiz_completed'),
    ).rejects.toThrow('Missing user id');
    await expect(streak.restoreMutation.mutateAsync()).rejects.toThrow(
      'Missing user id',
    );
    await expect(
      streak.applyFreezeMutation.mutateAsync('2026-07-08'),
    ).rejects.toThrow('Missing user id');
    await expect(
      streak.purchaseFreezeTokenMutation.mutateAsync(),
    ).rejects.toThrow('Missing user id');
    expect(trackLearningActivity).not.toHaveBeenCalled();
    expect(restoreStreakForCoins).not.toHaveBeenCalled();
    expect(applyFreezeToMissedDay).not.toHaveBeenCalled();
    expect(buyStreakFreezeToken).not.toHaveBeenCalled();
    expect(mockShowBanner).not.toHaveBeenCalled();
  });
});
