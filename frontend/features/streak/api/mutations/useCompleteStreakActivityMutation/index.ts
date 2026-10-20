import { useMutation } from '@tanstack/react-query';

import { trackLearningActivity } from '../../../utils/trackLearningActivity';
import type { StreakActivityType } from '../../../types';
import { useStreakCacheUpdate } from '../hooks/useStreakCacheUpdate';
import type { StreakUpdateMutationParams } from '../types';

/**
 * Tracks an activity through the existing offline-aware service.
 *
 * @param params - Profile owner and optional callback for newly unlocked milestones.
 * @returns Mutation accepting an activity type; success updates profile/achievements,
 * including when the service resolves with its offline fallback.
 * @example
 * const activity = useCompleteStreakActivityMutation({ userId });
 * activity.mutate('article_quiz_completed');
 * // After completion, the owner's profile cache contains the returned state.
 */
export function useCompleteStreakActivityMutation(
  params: StreakUpdateMutationParams,
) {
  const { userId } = params;
  const updateStreak = useStreakCacheUpdate(params);

  return useMutation({
    mutationFn: async (activityType: StreakActivityType) => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return trackLearningActivity(userId, activityType);
    },
    onSuccess: updateStreak,
  });
}
