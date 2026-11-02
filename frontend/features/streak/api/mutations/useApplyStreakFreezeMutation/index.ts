import { useAuthenticatedUser } from '@/features/auth';
import type { StreakState } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyStreakFreeze } from '../../requests/applyStreakFreeze';
import { useStreakCacheUpdate } from '../hooks/useStreakCacheUpdate';

/**
 * Freezes a missed day and requests refreshed calendars for the owner.
 *
 * @returns Mutation accepting a date key. Success updates profile/achievements
 * before invalidating all of this user's calendar months; errors leave caches intact.
 * @example
 * const freeze = useApplyStreakFreezeMutation();
 * await freeze.mutateAsync('2026-07-09');
 * // The profile is updated and the user's calendar queries are invalidated.
 */
export function useApplyStreakFreezeMutation() {
  const { id: userId } = useAuthenticatedUser();
  const queryClient = useQueryClient();
  const updateStreak = useStreakCacheUpdate();

  return useMutation({
    onMutate: () =>
      queryClient.getQueryData<StreakState>(['streak-profile', userId]),
    mutationFn: (date: string) => applyStreakFreeze({ date }),
    onSuccess: (streak) => {
      updateStreak(streak);

      void queryClient.invalidateQueries({
        queryKey: ['streak-calendar-month', userId],
      });
    },
  });
}
