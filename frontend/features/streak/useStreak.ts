import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useBanner } from '@/components/banner';

import {
  getNewlyUnlockedStreakAchievements,
  getStreakAchievementDescriptionKey,
  getStreakAchievementTitleKey,
} from './achievements';
import { getStreakProfile } from './api';
import {
  applyFreezeToMissedDay,
  buyStreakFreezeToken,
  restoreStreakForCoins,
  syncPendingStreakEvents,
  trackLearningActivity,
} from './service';
import type { StreakActivityType, StreakState } from './types';

export function useStreak(userId?: string) {
  const queryClient = useQueryClient();
  const { showBanner } = useBanner();
  const { t } = useTranslation();

  const handleStreakUpdate = (streak: StreakState) => {
    if (!userId) {
      return;
    }

    const previousStreak = queryClient.getQueryData<StreakState>([
      'streak-profile',
      userId,
    ]);
    const newlyUnlocked = getNewlyUnlockedStreakAchievements(
      previousStreak?.claimedStreakAchievements ?? [],
      streak.claimedStreakAchievements,
    );

    queryClient.setQueryData(['streak-profile', userId], streak);

    if (newlyUnlocked.length > 0) {
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', userId],
      });
    }

    const achievement = newlyUnlocked[0];

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

  const streakQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      await syncPendingStreakEvents(userId);
      return getStreakProfile(userId);
    },
    queryKey: ['streak-profile', userId],
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (activityType: StreakActivityType) => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return trackLearningActivity(userId, activityType);
    },
    onSuccess: handleStreakUpdate,
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return restoreStreakForCoins(userId);
    },
    onSuccess: handleStreakUpdate,
  });

  const applyFreezeMutation = useMutation({
    mutationFn: async (date: string) => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return applyFreezeToMissedDay(userId, date);
    },
    onSuccess: (streak) => {
      handleStreakUpdate(streak);

      if (!userId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ['streak-calendar-month', userId],
      });
    },
  });

  const purchaseFreezeTokenMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return buyStreakFreezeToken(userId);
    },
    onSuccess: (streak) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData(['streak-profile', userId], streak);
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', userId],
      });
    },
  });

  return {
    applyFreezeMutation,
    completeActivityMutation,
    purchaseFreezeTokenMutation,
    restoreMutation,
    streakQuery,
  };
}
