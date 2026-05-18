import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  applyStreakFreeze,
  completeStreakActivity,
  getStreakProfile,
  purchaseStreakFreezeToken,
  restoreBrokenStreak,
} from './api';
import { STREAK_FREEZE_TOKEN_PRICE, STREAK_RESTORE_PRICE } from './constants';
import {
  type CompleteActivityRequest,
  type StreakActivityType,
  type StreakReminderState,
  type StreakState,
} from './types';

const pendingEventsStorageKey = 'readovo.streak.pendingActivityEvents';

type PendingActivityEvent = {
  activityType: StreakActivityType;
  createdAt: string;
};

function buildFallbackStreakState(): StreakState {
  return {
    activityHistory: [],
    brokenStreakInfo: null,
    claimedStreakAchievements: [],
    coinBalance: 0,
    currentStreak: 0,
    freezeTokens: 0,
    lastActivityDate: null,
    longestStreak: 0,
    nextBonusInDays: 3,
    nextMilestone: 3,
    serverNow: new Date().toISOString(),
    todayStatus: 'pending',
  };
}

async function loadPendingEvents(): Promise<PendingActivityEvent[]> {
  const rawValue = await AsyncStorage.getItem(pendingEventsStorageKey);

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

async function savePendingEvents(events: PendingActivityEvent[]): Promise<void> {
  await AsyncStorage.setItem(pendingEventsStorageKey, JSON.stringify(events));
}

export async function syncPendingStreakEvents(userId: string): Promise<void> {
  const pendingEvents = await loadPendingEvents();

  if (pendingEvents.length === 0) {
    return;
  }

  const remainingEvents: PendingActivityEvent[] = [];

  for (const event of pendingEvents) {
    try {
      await completeStreakActivity(userId, {
        activityType: event.activityType,
      });
    } catch {
      remainingEvents.push(event);
    }
  }

  await savePendingEvents(remainingEvents);
}

export async function queuePendingStreakEvent(activityType: StreakActivityType): Promise<void> {
  const pendingEvents = await loadPendingEvents();

  pendingEvents.push({
    activityType,
    createdAt: new Date().toISOString(),
  });

  await savePendingEvents(pendingEvents);
}

export async function trackLearningActivity(
  userId: string,
  activityType: StreakActivityType,
): Promise<StreakState> {
  const payload: CompleteActivityRequest = {
    activityType,
    occurredAtClient: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  try {
    const response = await completeStreakActivity(userId, payload);
    return response.streak;
  } catch {
    await queuePendingStreakEvent(activityType);

    const fallback = await getStreakProfile(userId).catch(() => buildFallbackStreakState());
    return fallback;
  }
}

export function getStreakReminderState(streak: StreakState): StreakReminderState {
  if (streak.todayStatus === 'pending') {
    return {
      cta: 'Почати зараз',
      message: 'Твій відрізок у небезпеці ??',
      shouldShow: true,
    };
  }

  return {
    cta: '',
    message: '',
    shouldShow: false,
  };
}

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

export async function restoreStreakForCoins(userId: string): Promise<StreakState> {
  return restoreBrokenStreak(userId, { price: STREAK_RESTORE_PRICE });
}

export async function applyFreezeToMissedDay(
  userId: string,
  date: string,
): Promise<StreakState> {
  return applyStreakFreeze(userId, { date });
}

export async function buyStreakFreezeToken(userId: string): Promise<StreakState> {
  return purchaseStreakFreezeToken(userId, { price: STREAK_FREEZE_TOKEN_PRICE });
}

