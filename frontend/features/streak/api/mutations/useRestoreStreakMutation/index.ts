import { useMutation } from '@tanstack/react-query';

import { restoreStreakForCoins } from '../../../utils/restoreStreakForCoins';
import { useStreakCacheUpdate } from '../hooks/useStreakCacheUpdate';
import type { StreakUpdateMutationParams } from '../types';

/**
 * Restores a streak using the existing coin price and service.
 *
 * @param params - Profile owner and optional callback for newly unlocked milestones.
 * @returns Mutation controls; success replaces the profile and invalidates newly
 * unlocked achievements. Errors leave caches intact; calendars are not invalidated.
 * @example
 * const restore = useRestoreStreakMutation({ userId });
 * await restore.mutateAsync();
 * // The returned profile has been cached for this user.
 */
export function useRestoreStreakMutation(params: StreakUpdateMutationParams) {
  const { userId } = params;
  const updateStreak = useStreakCacheUpdate(params);

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return restoreStreakForCoins(userId);
    },
    onSuccess: updateStreak,
  });
}
