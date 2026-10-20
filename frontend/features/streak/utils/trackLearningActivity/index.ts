import { getAuthSessionSnapshot } from '@/features/auth';
import { completeStreakActivity } from '../../api/requests/completeStreakActivity';
import { getStreakProfile } from '../../api/requests/getStreakProfile';
import type {
  CompleteActivityRequest,
  StreakActivityType,
  StreakState,
} from '../../types';
import { queuePendingStreakEvent } from '../queuePendingStreakEvent';

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

/**
 * Submits an activity in the expected session, retaining the existing offline fallback.
 *
 * @param userId - Local queue owner and expected session owner; not sent over HTTP.
 * @param activityType - Completed activity used to build the existing request payload.
 * @returns Server streak, or a fetched/default profile after queueing a failed activity.
 * Session changes reject instead of queueing or fetching under another login.
 * @example
 * const streak = await trackLearningActivity(userId, 'article_quiz_completed');
 * // On a network failure, the activity is queued only for userId.
 */
export async function trackLearningActivity(
  userId: string,
  activityType: StreakActivityType,
): Promise<StreakState> {
  const session = await getAuthSessionSnapshot(userId);
  session.assertCurrent();
  const payload: CompleteActivityRequest = {
    activityType,
    occurredAtClient: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  try {
    const response = await completeStreakActivity(payload);
    session.assertCurrent();
    return response.streak;
  } catch {
    session.assertCurrent();
    await queuePendingStreakEvent(userId, activityType);
    session.assertCurrent();

    const fallback = await getStreakProfile().catch(() =>
      buildFallbackStreakState(),
    );
    session.assertCurrent();
    return fallback;
  }
}
