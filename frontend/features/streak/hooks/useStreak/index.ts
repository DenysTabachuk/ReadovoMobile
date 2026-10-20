import { useTranslation } from 'react-i18next';

import { useBanner } from '@/components/banner';

import {
  getStreakAchievementDescriptionKey,
  getStreakAchievementTitleKey,
} from '../../achievements';
import {
  useApplyStreakFreezeMutation,
  useCompleteStreakActivityMutation,
  usePurchaseStreakFreezeTokenMutation,
  useRestoreStreakMutation,
  useStreakProfileQuery,
} from '../../api';
import type { StreakAchievement } from '../../types';

/**
 * Composes streak operations and presents the first newly unlocked achievement.
 *
 * @param userId - Owner passed to each operation; absent IDs disable profile fetching.
 * @returns The existing profile query and four mutation objects used by consumers.
 * Data hooks own requests and cache changes; this hook owns the translated banner.
 * @example
 * const { streakQuery, restoreMutation } = useStreak(userId);
 * // Use streakQuery for rendering and restoreMutation.mutate() to request a restore.
 * // Successful activity, restore, or freeze operations may show an achievement banner.
 */
export function useStreak(userId?: string) {
  const { showBanner } = useBanner();
  const { t } = useTranslation();

  const onAchievementsUnlocked = (achievements: StreakAchievement[]) => {
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

  const streakQuery = useStreakProfileQuery(userId);
  const completeActivityMutation = useCompleteStreakActivityMutation({
    userId,
    onAchievementsUnlocked,
  });
  const restoreMutation = useRestoreStreakMutation({
    userId,
    onAchievementsUnlocked,
  });
  const applyFreezeMutation = useApplyStreakFreezeMutation({
    userId,
    onAchievementsUnlocked,
  });
  const purchaseFreezeTokenMutation =
    usePurchaseStreakFreezeTokenMutation(userId);

  return {
    applyFreezeMutation,
    completeActivityMutation,
    purchaseFreezeTokenMutation,
    restoreMutation,
    streakQuery,
  };
}
