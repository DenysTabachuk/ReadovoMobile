import type {
  AchievementStatus,
  AchievementsProfileResponse,
} from '@/features/achievements';
import type { MascotProfile } from '@/features/mascot';
import type { StreakState } from '@/features/streak';
import { useProfileOverview } from '.';

type ProfileRead<T> = {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: jest.Mock;
};

jest.mock('@/features/auth', () => ({
  useAuthenticatedUser: () => ({
    id: 'reader-a',
    displayName: null,
    email: 'reader@example.test',
  }),
}));
jest.mock('@/features/achievements', () => ({
  useAchievementsProfileQuery: () => mockAchievements,
}));
jest.mock('@/features/mascot', () => ({
  useMascotProfileQuery: () => mockMascot,
}));
jest.mock('@/features/streak', () => ({
  useStreakProfileQuery: () => mockStreak,
}));
// Error-code mapping has its own suite; distinguish sources here to check precedence.
jest.mock('@/api/utils/getApiErrorMessageKey', () => ({
  getApiErrorMessageKey: (error: Error) => error.message,
}));

const ACHIEVEMENT: AchievementStatus = {
  badgeKey: 'first_test_completed',
  claimedAt: null,
  coinsReward: 10,
  descriptionKey: 'achievement.description',
  id: 'first_test_completed',
  isClaimed: false,
  isUnlocked: true,
  progressValue: 1,
  targetValue: 1,
  titleKey: 'achievement.title',
  unlockedAt: '2026-11-02',
};
const ACHIEVEMENTS: AchievementsProfileResponse = {
  achievements: [
    ACHIEVEMENT,
    { ...ACHIEVEMENT, id: 'ten_tests_completed', isUnlocked: false },
  ],
  progress: {
    balance: 50,
    lessonsCompleted: 2,
    testsCompleted: 3,
    wordsLearned: 4,
  },
  userId: 'reader-a',
};
const STREAK: StreakState = {
  activityHistory: [],
  brokenStreakInfo: null,
  claimedStreakAchievements: [
    { milestone: 3, claimedAt: '2026-11-01', isUnlocked: true, rewardCoins: 5 },
    { milestone: 7, claimedAt: null, isUnlocked: false, rewardCoins: 10 },
  ],
  coinBalance: 50,
  currentStreak: 3,
  freezeTokenPrice: 20,
  freezeTokens: 1,
  lastActivityDate: '2026-11-01',
  longestStreak: 3,
  nextBonusInDays: 4,
  nextMilestone: 7,
  restorePrice: 50,
  serverNow: '2026-11-02T12:00:00Z',
  todayStatus: 'pending',
};
let mockAchievements: ProfileRead<AchievementsProfileResponse>;
let mockMascot: ProfileRead<MascotProfile>;
let mockStreak: ProfileRead<StreakState>;

beforeEach(() => {
  mockAchievements = {
    data: ACHIEVEMENTS,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  };
  mockMascot = {
    data: {
      userId: 'reader-a',
      equippedItems: { head: 'hat' },
      ownedItemIds: ['hat'],
    },
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  };
  mockStreak = {
    data: STREAK,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  };
});

it('prepares profile data and counts unlocked achievements from both sources', () => {
  expect(useProfileOverview()).toMatchObject({
    user: { id: 'reader-a', displayName: null, email: 'reader@example.test' },
    progress: {
      balance: 50,
      lessonsCompleted: 2,
      testsCompleted: 3,
      wordsLearned: 4,
    },
    achievements: ACHIEVEMENTS.achievements,
    equippedItems: { head: 'hat' },
    achievementsCount: 2,
    currentStreak: 3,
    hasStreak: true,
    isLoading: false,
    errorMessageKey: null,
  });
});

it.each(['achievements', 'mascot', 'streak'] as const)(
  'waits for initial %s data',
  (source) => {
    const reads = {
      achievements: mockAchievements,
      mascot: mockMascot,
      streak: mockStreak,
    };
    reads[source].data = undefined;
    reads[source].isLoading = true;
    expect(useProfileOverview().isLoading).toBe(true);
  },
);

it('keeps cached data visible after refetch failures', () => {
  mockAchievements.error = new Error('errors.achievements');
  mockMascot.error = new Error('errors.mascot');
  mockStreak.error = new Error('errors.streak');
  expect(useProfileOverview()).toMatchObject({
    progress: ACHIEVEMENTS.progress,
    currentStreak: 3,
    achievementsCount: 2,
    isLoading: false,
    errorMessageKey: null,
  });
});

it('prioritizes missing-data errors as achievements, mascot, then streak', () => {
  mockAchievements.data = undefined;
  mockMascot.data = undefined;
  mockStreak.data = undefined;
  mockAchievements.error = new Error('errors.achievements');
  mockMascot.error = new Error('errors.mascot');
  mockStreak.error = new Error('errors.streak');
  expect(useProfileOverview().errorMessageKey).toBe('errors.achievements');
  mockAchievements.data = ACHIEVEMENTS;
  expect(useProfileOverview().errorMessageKey).toBe('errors.mascot');
  mockMascot.data = { userId: 'reader-a', equippedItems: {}, ownedItemIds: [] };
  expect(useProfileOverview().errorMessageKey).toBe('errors.streak');
});

it('uses explicit empty-state defaults when profile reads have no data', () => {
  mockAchievements.data = undefined;
  mockMascot.data = undefined;
  mockStreak.data = undefined;
  expect(useProfileOverview()).toMatchObject({
    progress: {
      balance: 0,
      lessonsCompleted: 0,
      testsCompleted: 0,
      wordsLearned: 0,
    },
    achievements: [],
    equippedItems: undefined,
    achievementsCount: 0,
    currentStreak: 0,
    hasStreak: false,
  });
});

it('retries all profile reads together', () => {
  useProfileOverview().retry();
  expect(mockAchievements.refetch).toHaveBeenCalledTimes(1);
  expect(mockMascot.refetch).toHaveBeenCalledTimes(1);
  expect(mockStreak.refetch).toHaveBeenCalledTimes(1);
});
