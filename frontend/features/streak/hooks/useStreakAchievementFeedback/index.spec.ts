import type { StreakAchievement, StreakState } from '../../types';
import { useStreakAchievementFeedback } from '.';

const mockShowBanner = jest.fn();
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function createStreakState(achievements: StreakAchievement[]): StreakState {
  return {
    activityHistory: [],
    brokenStreakInfo: null,
    claimedStreakAchievements: achievements,
    coinBalance: 100,
    currentStreak: 7,
    restorePrice: 100,

    freezeTokenPrice: 100,

    freezeTokens: 1,
    lastActivityDate: '2026-07-08',
    longestStreak: 7,
    nextBonusInDays: 2,
    nextMilestone: 14,
    serverNow: '2026-07-08T12:00:00Z',
    todayStatus: 'completed',
  };
}

const FIRST_MILESTONE: StreakAchievement = {
  milestone: 3,
  rewardCoins: 5,
  isUnlocked: true,
  claimedAt: '2026-07-06',
};
const SECOND_MILESTONE: StreakAchievement = {
  milestone: 7,
  rewardCoins: 10,
  isUnlocked: true,
  claimedAt: '2026-07-08',
};

beforeEach(() => jest.clearAllMocks());

it('shows only the first new milestone when no previous profile is available', () => {
  useStreakAchievementFeedback()(
    createStreakState([FIRST_MILESTONE, SECOND_MILESTONE]),
  );
  expect(mockShowBanner.mock.calls).toEqual([
    [
      {
        achievement: { coinsReward: 5, icon: 'trophy' },
        description: 'streak.achievements.3.description',
        title: 'streak.achievements.3.title',
        variant: 'achievement',
      },
    ],
  ]);
});

it('skips a previously claimed milestone and shows the newly claimed reward', () => {
  useStreakAchievementFeedback()(
    createStreakState([FIRST_MILESTONE, SECOND_MILESTONE]),
    createStreakState([FIRST_MILESTONE]),
  );
  expect(mockShowBanner).toHaveBeenCalledWith({
    achievement: { coinsReward: 10, icon: 'trophy' },
    description: 'streak.achievements.7.description',
    title: 'streak.achievements.7.title',
    variant: 'achievement',
  });
});

it('does not display a banner when nothing new was claimed', () => {
  const showFeedback = useStreakAchievementFeedback();
  showFeedback(createStreakState([]));
  showFeedback(
    createStreakState([FIRST_MILESTONE]),
    createStreakState([FIRST_MILESTONE]),
  );
  expect(mockShowBanner).not.toHaveBeenCalled();
});
