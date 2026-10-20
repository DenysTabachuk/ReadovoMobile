import { getAuthSessionSnapshot } from '@/features/auth';
import { purchaseStreakFreezeToken } from '../../api/requests/purchaseStreakFreezeToken';
import { STREAK_FREEZE_TOKEN_PRICE } from '../../constants';
import type { StreakState } from '../../types';

/**
 * Buys a freeze token in the expected account's session at the configured price.
 * @param userId - Local session owner; never included in the HTTP request.
 * @returns Server profile; session changes reject with AbortError.
 * @example
 * const streak = await buyStreakFreezeToken(userId);
 * // The authenticated account paid STREAK_FREEZE_TOKEN_PRICE.
 */
export async function buyStreakFreezeToken(
  userId: string,
): Promise<StreakState> {
  const session = await getAuthSessionSnapshot(userId);
  session.assertCurrent();
  const streak = await purchaseStreakFreezeToken({
    price: STREAK_FREEZE_TOKEN_PRICE,
  });
  session.assertCurrent();
  return streak;
}
