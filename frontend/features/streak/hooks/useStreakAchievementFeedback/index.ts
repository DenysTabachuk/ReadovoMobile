import { useTranslation } from 'react-i18next';
import { useBanner } from '@/components/banner';
import {
  getNewlyUnlockedStreakAchievements,
  getStreakAchievementDescriptionKey,
  getStreakAchievementTitleKey,
} from '../../achievements';
import type { StreakState } from '../../types';

/**
 * Builds UI feedback for the first newly unlocked streak milestone.
 * @returns A handler comparing confirmed and previous streak state. Missing previous
 * state means no claimed milestones; no new milestone produces no banner. Invoke
 * from a per-call mutate callback so unmounting discards screen feedback.
 * @example
 * const showUnlockedAchievements = useStreakAchievementFeedback();
 * restore.mutate(undefined, {
 *   onSuccess: (streak, _variables, previous) => showUnlockedAchievements(streak, previous),
 * }); // Shows the first new milestone only while the screen observer remains mounted.
 */
export function useStreakAchievementFeedback() {
  const { showBanner } = useBanner();
  const { t } = useTranslation();

  return (streak: StreakState, previousStreak?: StreakState) => {
    const achievements = getNewlyUnlockedStreakAchievements(
      previousStreak?.claimedStreakAchievements ?? [],
      streak.claimedStreakAchievements,
    );
    const achievement = achievements[0];
    if (!achievement) {
      return;
    }

    showBanner({
      achievement: {
        coinsReward: achievement.rewardCoins,
        icon: 'trophy',
      },
      description: t(getStreakAchievementDescriptionKey(achievement)),
      title: t(getStreakAchievementTitleKey(achievement)),
      variant: 'achievement',
    });
  };
}
