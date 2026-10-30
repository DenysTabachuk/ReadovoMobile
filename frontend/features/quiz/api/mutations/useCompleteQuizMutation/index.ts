import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';
import { useBanner } from '@/components/banner';
import { getAchievementBadge } from '@/features/achievements';
import { getAuthSessionSnapshot, useAuth } from '@/features/auth';
import {
  getStreakAchievementTitleKey,
  getStreakAchievementDescriptionKey,
} from '@/features/streak';
import type { QuizSessionResult } from '../../../types';
import { completeQuiz } from '../../requests/completeQuiz';

type UseCompleteQuizMutationParams = {
  sessionId?: string;
  onCompleted: (result: QuizSessionResult) => void;
};

const REWARD_BANNER_DURATION_MS = 4200;

/**
 * Completes a saved server quiz and displays only confirmed results and rewards.
 * Retries reuse the session, so a committed completion cannot grant twice. Old
 * auth sessions cannot update caches or UI; replayed completions do not repeat banners.
 * @param params - Server session ID and the UI callback for authoritative score presentation.
 * @returns A mutation accepting local timing; client score/counts never go to the server.
 * @example
 * const completion = useCompleteQuizMutation({ sessionId, onCompleted: setResult });
 * completion.mutate(localResult); // Shows the server score only after completion succeeds.
 */
export function useCompleteQuizMutation({
  sessionId,
  onCompleted,
}: UseCompleteQuizMutationParams) {
  const { currentUser } = useAuth();
  const client = useQueryClient();
  const { showBanner } = useBanner();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (localResult: QuizSessionResult) => {
      if (!sessionId || !currentUser?.id)
        throw new Error('Missing quiz session.');
      const session = await getAuthSessionSnapshot(currentUser.id);
      session.assertCurrent();
      try {
        const response = await completeQuiz(sessionId);
        session.assertCurrent();
        return {
          response,
          session,
          durationSeconds: localResult.durationSeconds,
        };
      } catch (error) {
        session.assertCurrent();
        throw error;
      }
    },
    onError: (error) => {
      const key = getApiErrorMessageKey(error);
      if (key) showBanner({ title: t(key), variant: 'error' });
    },
    onSuccess: ({ response, session, durationSeconds }) => {
      try {
        session.assertCurrent();
      } catch {
        return;
      }
      if (response.sessionId !== sessionId) return;
      const owner = response.profile.userId;
      // Refetch authoritative state instead of installing a response that may
      // arrive after another completion or purchase in the same account.
      void client.invalidateQueries({
        queryKey: ['achievements-profile', owner],
      });
      void client.invalidateQueries({ queryKey: ['streak-profile', owner] });
      void client.invalidateQueries({
        queryKey: ['streak-calendar-month', owner],
      });
      void client.invalidateQueries({
        queryKey: ['dictionary', 'words', owner],
      });
      const { completion } = response;
      onCompleted({
        correctAnswers: completion.correctAnswers,
        totalQuestions: completion.totalQuestions,
        percentage: completion.percentage,
        wrongAnswers: completion.totalQuestions - completion.correctAnswers,
        durationSeconds,
      });
      if (response.replayed) return;
      showBanner({
        title: t('profile.reward', { count: completion.rewards.quizCoins }),
        variant: 'reward',
        durationMs: REWARD_BANNER_DURATION_MS,
      });
      if (completion.shouldShowStreakBanner)
        showBanner({
          title: t('streak.banner.title'),
          description: t('streak.banner.description', {
            count: response.streak.currentStreak,
          }),
          variant: 'streak',
          durationMs: REWARD_BANNER_DURATION_MS,
        });
      for (const achievement of response.profile.achievements.filter((item) =>
        completion.newlyUnlockedAchievementIds.includes(item.id),
      )) {
        showBanner({
          title: t(achievement.titleKey),
          description: t(achievement.descriptionKey),
          achievement: {
            badge: getAchievementBadge(achievement.badgeKey),
            coinsReward: achievement.coinsReward,
          },
          variant: 'achievement',
          durationMs: REWARD_BANNER_DURATION_MS,
        });
      }
      for (const achievement of response.streak.claimedStreakAchievements.filter(
        (item) =>
          completion.newlyUnlockedStreakMilestones.includes(item.milestone),
      )) {
        showBanner({
          title: t(getStreakAchievementTitleKey(achievement)),
          description: t(getStreakAchievementDescriptionKey(achievement)),
          achievement: { icon: 'trophy', coinsReward: achievement.rewardCoins },
          variant: 'achievement',
          durationMs: REWARD_BANNER_DURATION_MS,
        });
      }
    },
  });
}
