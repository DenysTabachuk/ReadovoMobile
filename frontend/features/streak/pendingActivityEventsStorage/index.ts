import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PendingActivityEvent } from './types';

const pendingEventsStorageKey = 'readovo.streak.pendingActivityEvents';

async function loadPendingEvents(
  userId: string,
): Promise<PendingActivityEvent[]> {
  // Legacy entries have no provable owner and must never be replayed as /me.
  const rawValue = await AsyncStorage.getItem(
    `${pendingEventsStorageKey}:${userId}`,
  );

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as PendingActivityEvent[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

async function savePendingEvents(
  userId: string,
  events: PendingActivityEvent[],
): Promise<void> {
  await AsyncStorage.setItem(
    `${pendingEventsStorageKey}:${userId}`,
    JSON.stringify(events),
  );
}

/**
 * Reads and replaces the existing per-account activity queue in AsyncStorage.
 * Both operations take a local owner ID; write also takes the ordered events.
 * Reads return an empty list for missing, non-array, or invalid JSON values.
 * Writes resolve after persistence, do not mutate inputs, and propagate failures.
 * Legacy unowned keys are ignored. Read/write pairs are not atomic or serialized.
 * @example
 * const events = await pendingActivityEventsStorage.read(userId);
 * await pendingActivityEventsStorage.write(userId, events);
 * // Persists the same events only under this owner's key.
 */
export const pendingActivityEventsStorage = {
  read: loadPendingEvents,
  write: savePendingEvents,
};
