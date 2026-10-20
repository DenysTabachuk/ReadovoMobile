import { getAuthSessionSnapshot } from '@/features/auth';
import { applyStreakFreeze } from '../../api/requests/applyStreakFreeze';
import type { StreakState } from '../../types';

/**
 * Applies a freeze in the expected account's session.
 * @param userId - Local session owner; never included in the HTTP request.
 * @param date - Missed day date key.
 * @returns Server profile; session changes reject with AbortError.
 * @example
 * const streak = await applyFreezeToMissedDay(userId, '2026-07-08');
 * // Returns the authenticated account's updated freeze state.
 */
export async function applyFreezeToMissedDay(
  userId: string,
  date: string,
): Promise<StreakState> {
  const session = await getAuthSessionSnapshot(userId);
  session.assertCurrent();
  const streak = await applyStreakFreeze({ date });
  session.assertCurrent();
  return streak;
}
