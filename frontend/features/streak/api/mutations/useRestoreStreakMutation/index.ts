import type { StreakState } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { restoreBrokenStreak } from '../../requests/restoreBrokenStreak';
import { useStreakCacheUpdate } from '../hooks/useStreakCacheUpdate';

/**
 * Restores a streak using the configured coin price.
 *
 * @param userId - Profile owner.
 * @returns Mutation controls; success replaces the profile and invalidates newly
 * unlocked achievements and all calendar months. Errors leave caches intact.
 * @example
 * const restore = useRestoreStreakMutation(userId);
 * await restore.mutateAsync();
 * // The returned profile has been cached for this user.
 */
export function useRestoreStreakMutation(userId: string) {
  const queryClient = useQueryClient();
  const updateStreak = useStreakCacheUpdate(userId);

  return useMutation({
    onMutate: () =>
      queryClient.getQueryData<StreakState>(['streak-profile', userId]),
    mutationFn: restoreBrokenStreak,
    onSuccess: (streak) => {
      updateStreak(streak);
      void queryClient.invalidateQueries({
        queryKey: ['streak-calendar-month', userId],
      });
    },
  });
}
