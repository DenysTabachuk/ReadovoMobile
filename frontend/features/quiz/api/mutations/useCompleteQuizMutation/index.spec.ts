import {
  MutationCache,
  type MutationObserverOptions,
  QueryClient,
} from '@tanstack/react-query';
import { completeQuiz } from '../../requests/completeQuiz';
import type { QuizCompletionResponse } from '../../types';
import { useCompleteQuizMutation } from '.';

let mockClient = new QueryClient();
let mockVersion = 1;
const mockBanner = jest.fn();
const onCompleted = jest.fn();

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: { id: 'reader-a' } }),
  getAuthSessionSnapshot: async () => {
    const version = mockVersion;
    return {
      assertCurrent: () => {
        if (version !== mockVersion)
          throw Object.assign(new Error('Session changed.'), {
            name: 'AbortError',
          });
      },
    };
  },
}));
jest.mock('@/features/achievements', () => ({
  getAchievementBadge: jest.fn(() => 1),
}));
jest.mock('@/features/streak', () => ({
  getStreakAchievementTitleKey: () => 'streak.title',
  getStreakAchievementDescriptionKey: () => 'streak.description',
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../requests/completeQuiz', () => ({ completeQuiz: jest.fn() }));
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQueryClient: () => mockClient,
    useMutation: <TData, TError, TVariables, TContext>(
      options: MutationObserverOptions<TData, TError, TVariables, TContext>,
    ) => {
      const observer = new actual.MutationObserver(mockClient, options);
      return { mutateAsync: observer.mutate.bind(observer) };
    },
  };
});

const LOCAL_SCORE = {
  correctAnswers: 999,
  totalQuestions: 999,
  wrongAnswers: 0,
  percentage: 100,
  durationSeconds: 12,
};
const RESPONSE: QuizCompletionResponse = {
  sessionId: 'session-1',
  replayed: false,
  completion: {
    correctAnswers: 2,
    totalQuestions: 3,
    percentage: 67,
    rewards: {
      quizCoins: 20,
      achievementCoins: 0,
      streakCoins: 0,
      totalCoins: 20,
    },
    newlyUnlockedAchievementIds: [],
    newlyUnlockedStreakMilestones: [],
    shouldShowStreakBanner: false,
  },
  profile: {
    userId: 'reader-a',
    progress: {
      balance: 20,
      testsCompleted: 1,
      wordsLearned: 0,
      lessonsCompleted: 0,
    },
    achievements: [],
  },
  streak: {
    activityHistory: [],
    brokenStreakInfo: null,
    claimedStreakAchievements: [],
    coinBalance: 20,
    currentStreak: 1,
    freezeTokens: 1,
    lastActivityDate: '2026-10-29',
    longestStreak: 1,
    nextBonusInDays: 2,
    nextMilestone: 3,
    serverNow: '2026-10-29T12:00:00Z',
    todayStatus: 'completed',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockVersion = 1;
  mockClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  mockClient.setQueryData(['achievements-profile', 'reader-a'], {
    balance: 'newer-cache-value',
  });
  mockClient.setQueryData(['achievements-profile', 'reader-b'], {
    balance: 'other-account',
  });
  jest.mocked(completeQuiz).mockResolvedValue(RESPONSE);
});
afterEach(() => mockClient.clear());

it('uses the server score and refetches owned state instead of overwriting newer cache data', async () => {
  await useCompleteQuizMutation({
    sessionId: 'session-1',
    onCompleted,
  }).mutateAsync(LOCAL_SCORE);

  expect(completeQuiz).toHaveBeenCalledWith('session-1');
  expect(onCompleted).toHaveBeenCalledWith({
    correctAnswers: 2,
    totalQuestions: 3,
    percentage: 67,
    wrongAnswers: 1,
    durationSeconds: 12,
  });
  expect(mockClient.getQueryData(['achievements-profile', 'reader-a'])).toEqual(
    { balance: 'newer-cache-value' },
  );
  expect(
    mockClient.getQueryState(['achievements-profile', 'reader-a'])
      ?.isInvalidated,
  ).toBe(true);
  expect(
    mockClient.getQueryState(['achievements-profile', 'reader-b'])
      ?.isInvalidated,
  ).toBe(false);
  expect(mockBanner).toHaveBeenCalledTimes(1);
});

it('does not repeat reward banners for a replayed completion', async () => {
  const mutation = useCompleteQuizMutation({
    sessionId: 'session-1',
    onCompleted,
  });
  await mutation.mutateAsync(LOCAL_SCORE);
  jest.mocked(completeQuiz).mockResolvedValue({ ...RESPONSE, replayed: true });
  await mutation.mutateAsync(LOCAL_SCORE);

  expect(onCompleted).toHaveBeenCalledTimes(2);
  expect(mockBanner).toHaveBeenCalledTimes(1);
});

it('queues every returned achievement and streak milestone with its own coin reward', async () => {
  const response: QuizCompletionResponse = {
    ...RESPONSE,
    completion: {
      ...RESPONSE.completion,
      newlyUnlockedAchievementIds: [
        'first_test_completed',
        'ten_tests_completed',
      ],
      newlyUnlockedStreakMilestones: [3],
      shouldShowStreakBanner: true,
    },
    profile: {
      ...RESPONSE.profile,
      achievements: [
        {
          id: 'first_test_completed',
          badgeKey: 'first-test-completed',
          titleKey: 'first.title',
          descriptionKey: 'first.description',
          coinsReward: 50,
          isClaimed: true,
          isUnlocked: true,
          progressValue: 10,
          targetValue: 1,
          claimedAt: null,
          unlockedAt: null,
        },
        {
          id: 'ten_tests_completed',
          badgeKey: 'first-test-completed',
          titleKey: 'ten.title',
          descriptionKey: 'ten.description',
          coinsReward: 100,
          isClaimed: true,
          isUnlocked: true,
          progressValue: 10,
          targetValue: 10,
          claimedAt: null,
          unlockedAt: null,
        },
      ],
    },
    streak: {
      ...RESPONSE.streak,
      claimedStreakAchievements: [
        { milestone: 3, rewardCoins: 30, isUnlocked: true, claimedAt: null },
      ],
    },
  };
  jest.mocked(completeQuiz).mockResolvedValue(response);
  await useCompleteQuizMutation({
    sessionId: 'session-1',
    onCompleted,
  }).mutateAsync(LOCAL_SCORE);
  expect(mockBanner.mock.calls.map(([banner]) => banner.title)).toEqual([
    'profile.reward',
    'streak.banner.title',
    'first.title',
    'ten.title',
    'streak.title',
  ]);
  expect(mockBanner).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'streak.title',
      achievement: { icon: 'trophy', coinsReward: 30 },
    }),
  );
});

it('leaves results and caches intact when completion fails and permits retrying the same session', async () => {
  const failure = new Error('Offline');
  jest.mocked(completeQuiz).mockRejectedValueOnce(failure);
  const mutation = useCompleteQuizMutation({
    sessionId: 'session-1',
    onCompleted,
  });
  await expect(mutation.mutateAsync(LOCAL_SCORE)).rejects.toBe(failure);
  expect(onCompleted).not.toHaveBeenCalled();
  expect(
    mockClient.getQueryState(['achievements-profile', 'reader-a'])
      ?.isInvalidated,
  ).toBe(false);
  await mutation.mutateAsync(LOCAL_SCORE);
  expect(jest.mocked(completeQuiz).mock.calls).toEqual([
    ['session-1'],
    ['session-1'],
  ]);
});

it('silently rejects a result completed in a replacement auth session', async () => {
  jest.mocked(completeQuiz).mockImplementationOnce(async () => {
    mockVersion += 1;
    return RESPONSE;
  });
  await expect(
    useCompleteQuizMutation({
      sessionId: 'session-1',
      onCompleted,
    }).mutateAsync(LOCAL_SCORE),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(onCompleted).not.toHaveBeenCalled();
  expect(mockBanner).not.toHaveBeenCalled();
  expect(
    mockClient.getQueryState(['achievements-profile', 'reader-a'])
      ?.isInvalidated,
  ).toBe(false);
});

it('suppresses a late success callback after the request has already resolved', async () => {
  const callbacksStarted = Promise.withResolvers<void>();
  const releaseCallbacks = Promise.withResolvers<void>();
  mockClient = new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: async () => {
        callbacksStarted.resolve();
        await releaseCallbacks.promise;
      },
    }),
  });
  const pending = useCompleteQuizMutation({
    sessionId: 'session-1',
    onCompleted,
  }).mutateAsync(LOCAL_SCORE);
  await callbacksStarted.promise;
  mockVersion += 1;
  releaseCallbacks.resolve();
  await pending;
  expect(onCompleted).not.toHaveBeenCalled();
  expect(mockBanner).not.toHaveBeenCalled();
});
