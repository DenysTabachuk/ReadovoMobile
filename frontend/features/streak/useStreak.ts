import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getStreakProfile } from './api';
import { restoreStreakForCoins, syncPendingStreakEvents, trackLearningActivity } from './service';
import type { StreakActivityType } from './types';

export function useStreak(userId?: string) {
  const queryClient = useQueryClient();

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
    onSuccess: (streak) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData(['streak-profile', userId], streak);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return restoreStreakForCoins(userId);
    },
    onSuccess: (streak) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData(['streak-profile', userId], streak);
    },
  });

  return {
    completeActivityMutation,
    restoreMutation,
    streakQuery,
  };
}

