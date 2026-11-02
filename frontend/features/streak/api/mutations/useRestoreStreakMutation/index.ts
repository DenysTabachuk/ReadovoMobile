import { useAuthenticatedUser } from '@/features/auth';
import type { StreakState } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { restoreBrokenStreak } from '../../requests/restoreBrokenStreak';
import { useStreakCacheUpdate } from '../hooks/useStreakCacheUpdate';

/**
 * Restores a streak using the configured coin price.
 *
 * @returns Mutation controls; success replaces the profile and invalidates newly
 * unlocked achievements and all calendar months. Errors leave caches intact.
 * @example
 * const restore = useRestoreStreakMutation();
 * await restore.mutateAsync();
 * // The returned profile has been cached for this user.
 */
export function useRestoreStreakMutation() {
  const { id: userId } = useAuthenticatedUser();
  const queryClient = useQueryClient();
  const updateStreak = useStreakCacheUpdate();

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
