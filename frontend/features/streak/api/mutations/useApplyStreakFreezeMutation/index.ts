import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyFreezeToMissedDay } from '../../../utils/applyFreezeToMissedDay';
import { useStreakCacheUpdate } from '../hooks/useStreakCacheUpdate';
import type { StreakUpdateMutationParams } from '../types';

/**
 * Freezes a missed day and requests refreshed calendars for the owner.
 *
 * @param params - Profile owner and optional callback for newly unlocked milestones.
 * @returns Mutation accepting a date key. Success updates profile/achievements
 * before invalidating all of this user's calendar months; errors leave caches intact.
 * @example
 * const freeze = useApplyStreakFreezeMutation({ userId });
 * await freeze.mutateAsync('2026-07-09');
 * // The profile is updated and the user's calendar queries are invalidated.
 */
export function useApplyStreakFreezeMutation(
  params: StreakUpdateMutationParams,
) {
  const { userId } = params;
  const queryClient = useQueryClient();
  const updateStreak = useStreakCacheUpdate(params);

  return useMutation({
    mutationFn: async (date: string) => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return applyFreezeToMissedDay(userId, date);
    },
    onSuccess: (streak) => {
      updateStreak(streak);

      if (!userId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ['streak-calendar-month', userId],
      });
    },
  });
}
