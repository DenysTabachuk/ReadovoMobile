import { useQueryClient } from '@tanstack/react-query';

import { getNewlyUnlockedStreakAchievements } from '../../../../achievements';
import type { StreakState } from '../../../../types';

/**
 * Creates the shared success handler for restore and freeze mutations.
 *
 * @param userId - Cache owner.
 * @returns Handler that replaces the profile, invalidates achievements only when
 * new milestones unlock, without invoking screen effects.
 * @example
 * const updateStreak = useStreakCacheUpdate(userId);
 * // Pass as onSuccess; it only updates the owning account cache.
 */
export function useStreakCacheUpdate(userId: string) {
  const queryClient = useQueryClient();

  return (streak: StreakState) => {
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
  };
}
