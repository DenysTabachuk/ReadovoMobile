import type { StreakActivityType } from '../../types';
import { pendingActivityEventsStorage } from '../../pendingActivityEventsStorage';

/**
 * Persists an activity in its explicit local owner's queue, without network access.
 *
 * @param userId - Owner whose storage key receives the event, even if signed out.
 * @param activityType - Completed learning activity to retry later.
 * @returns Completion of the timestamped event write; storage failures reject.
 * @example
 * await queuePendingStreakEvent(userId, 'article_quiz_completed');
 * // Only a later sync by this owner can submit the event.
 */
export async function queuePendingStreakEvent(
  userId: string,
  activityType: StreakActivityType,
): Promise<void> {
  const pendingEvents = await pendingActivityEventsStorage.read(userId);

  pendingEvents.push({
    activityType,
    createdAt: new Date().toISOString(),
  });

  await pendingActivityEventsStorage.write(userId, pendingEvents);
}
