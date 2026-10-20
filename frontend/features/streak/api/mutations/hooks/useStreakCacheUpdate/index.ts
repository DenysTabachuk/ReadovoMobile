import { useQueryClient } from '@tanstack/react-query';

import { getNewlyUnlockedStreakAchievements } from '../../../../achievements';
import type { StreakState } from '../../../../types';
import type { StreakUpdateMutationParams } from '../../types';

/**
 * Creates the shared success handler for activity, restore, and freeze mutations.
 *
 * @param params - Cache owner and optional notification callback.
 * @returns Handler that replaces the profile, invalidates achievements only when
 * new milestones unlock, and then notifies the caller. Missing owners are ignored.
 * @example
 * const updateStreak = useStreakCacheUpdate({ userId, onAchievementsUnlocked });
 * // Pass as onSuccess; the callback observes the already updated profile cache.
 */
export function useStreakCacheUpdate({
  userId,
  onAchievementsUnlocked,
}: StreakUpdateMutationParams) {
  const queryClient = useQueryClient();

  return (streak: StreakState) => {
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
      onAchievementsUnlocked?.(newlyUnlocked);
    }
  };
}
