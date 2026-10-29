import { getAuthSessionSnapshot } from '@/features/auth';
import { completeStreakActivity } from '../../api/requests/completeStreakActivity';
import { pendingActivityEventsStorage } from '../../pendingActivityEventsStorage';
import type { PendingActivityEvent } from '../../pendingActivityEventsStorage/types';

/**
 * Replays only the local owner's queued activities in the initiating session.
 *
 * @param userId - Local queue owner; backend identity comes from authentication.
 * @returns Completion after failed events are retained. Session changes abort replay
 * without continuing as another account. Legacy unowned queues are not read.
 * @example
 * await syncPendingStreakEvents(userId);
 * // Successfully submitted events are removed from this user's queue.
 */
export async function syncPendingStreakEvents(userId: string): Promise<void> {
  const session = await getAuthSessionSnapshot(userId);
  session.assertCurrent();
  const pendingEvents = await pendingActivityEventsStorage.read(userId);
  session.assertCurrent();

  if (pendingEvents.length === 0) {
    return;
  }

  const remainingEvents: PendingActivityEvent[] = [];

  for (const event of pendingEvents) {
    try {
      await completeStreakActivity({
        activityType: event.activityType,
      });
    } catch {
      remainingEvents.push(event);
    }
    session.assertCurrent();
  }

  await pendingActivityEventsStorage.write(userId, remainingEvents);
  session.assertCurrent();
}
