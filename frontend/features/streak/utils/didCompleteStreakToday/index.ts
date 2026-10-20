import type { StreakState } from '../../types';

/**
 * Detects a transition from a known non-completed profile to completed today.
 * @param previousStreak - Earlier profile; a missing baseline never counts.
 * @param nextStreak - Updated profile; missing or non-completed states return false.
 * @returns True only for a new completion relative to the supplied baseline.
 * @example
 * didCompleteStreakToday(undefined, completedProfile);
 * // => false
 */
export function didCompleteStreakToday(
  previousStreak: StreakState | null | undefined,
  nextStreak: StreakState | null | undefined,
): boolean {
  return (
    Boolean(previousStreak) &&
    previousStreak?.todayStatus !== 'completed' &&
    nextStreak?.todayStatus === 'completed'
  );
}
