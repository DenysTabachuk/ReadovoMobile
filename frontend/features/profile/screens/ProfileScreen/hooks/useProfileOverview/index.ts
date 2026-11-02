import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';
import {
  useAchievementsProfileQuery,
  type AchievementProgress,
} from '@/features/achievements';
import { useAuthenticatedUser } from '@/features/auth';
import { useMascotProfileQuery } from '@/features/mascot';
import { useStreakProfileQuery } from '@/features/streak';

const DEFAULT_PROFILE_PROGRESS: AchievementProgress = {
  balance: 0,
  lessonsCompleted: 0,
  testsCompleted: 0,
  wordsLearned: 0,
};

/**
 * Coordinates profile reads and prepares the data displayed by ProfileScreen.
 * Data hooks retain request/cache ownership. Initial reads without data show a
 * shared loader; cached data remains visible during refetches and refetch errors.
 * @returns Profile presentation data, loading/error state, and retry for all reads.
 * Missing-data errors prefer achievements, then mascot, then streak. Errors are
 * translation keys; retry uses each query's normal session-safe refetch behavior.
 * @example
 * const overview = useProfileOverview();
 * overview.retry();
 * // Refetches achievements, mascot, and streak without changing modal state.
 */
export function useProfileOverview() {
  const user = useAuthenticatedUser();
  const achievementsQuery = useAchievementsProfileQuery();
  const mascotQuery = useMascotProfileQuery();
  const streakQuery = useStreakProfileQuery();
  const achievements = achievementsQuery.data?.achievements ?? [];
  const streak = streakQuery.data;
  const unlockedAchievementsCount = achievements.filter(
    (achievement) => achievement.isUnlocked,
  ).length;
  const unlockedStreakAchievementsCount =
    streak?.claimedStreakAchievements.filter(
      (achievement) => achievement.isUnlocked,
    ).length ?? 0;

  let loadError: unknown = null;
  if (!achievementsQuery.data && achievementsQuery.error) {
    loadError = achievementsQuery.error;
  } else if (!mascotQuery.data && mascotQuery.error) {
    loadError = mascotQuery.error;
  } else if (!streakQuery.data && streakQuery.error) {
    loadError = streakQuery.error;
  }

  const isLoading = [achievementsQuery, mascotQuery, streakQuery].some(
    (query) => query.isLoading && !query.data,
  );
  const retry = () => {
    void achievementsQuery.refetch();
    void mascotQuery.refetch();
    void streakQuery.refetch();
  };

  return {
    user,
    progress: achievementsQuery.data?.progress ?? DEFAULT_PROFILE_PROGRESS,
    achievements,
    equippedItems: mascotQuery.data?.equippedItems,
    achievementsCount:
      unlockedAchievementsCount + unlockedStreakAchievementsCount,
    currentStreak: streak?.currentStreak ?? 0,
    hasStreak: Boolean(streak),
    isLoading,
    errorMessageKey: loadError ? getApiErrorMessageKey(loadError) : null,
    retry,
  };
}
