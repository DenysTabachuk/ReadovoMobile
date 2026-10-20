import { getAuthSessionSnapshot } from '@/features/auth';
import { restoreBrokenStreak } from '../../api/requests/restoreBrokenStreak';
import { STREAK_RESTORE_PRICE } from '../../constants';
import type { StreakState } from '../../types';

/**
 * Restores the expected account's streak at the configured price.
 * @param userId - Local session owner; never included in the HTTP request.
 * @returns Server profile; session changes reject with AbortError.
 * @example
 * const streak = await restoreStreakForCoins(userId);
 * // The authenticated account paid STREAK_RESTORE_PRICE.
 */
export async function restoreStreakForCoins(
  userId: string,
): Promise<StreakState> {
  const session = await getAuthSessionSnapshot(userId);
  session.assertCurrent();
  const streak = await restoreBrokenStreak({ price: STREAK_RESTORE_PRICE });
  session.assertCurrent();
  return streak;
}
