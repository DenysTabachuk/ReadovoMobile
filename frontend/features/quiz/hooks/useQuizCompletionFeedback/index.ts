import { useTranslation } from 'react-i18next';
import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';
import { useBanner } from '@/components/banner';
import { getAchievementBadge } from '@/features/achievements';
import {
  getStreakAchievementTitleKey,
  getStreakAchievementDescriptionKey,
} from '@/features/streak';
import type { QuizSessionResult } from '../../types';
import type { useCompleteQuizMutation } from '../../api/mutations/useCompleteQuizMutation';

type CompletionResult = Awaited<
  ReturnType<ReturnType<typeof useCompleteQuizMutation>['mutateAsync']>
>;

const REWARD_BANNER_DURATION_MS = 4200;

/**
 * Builds component-bound feedback for confirmed quiz completion and reward banners.
 * Pass these callbacks to mutate; they are discarded when the screen unmounts.
 * @param onCompleted - Displays the authoritative score on the current screen.
 * @returns Success and silent-cancellation-aware error callbacks.
 * @example
 * const feedback = useQuizCompletionFeedback(setResult);
 * completion.mutate(localResult, feedback); // Displays rewards only while mounted.
 */
export function useQuizCompletionFeedback(
  onCompleted: (result: QuizSessionResult) => void,
) {
  const { showBanner } = useBanner();
  const { t } = useTranslation();
  return {
    onError: (error: unknown) => {
      const key = getApiErrorMessageKey(error);
      if (key) showBanner({ title: t(key), variant: 'error' });
    },
    onSuccess: (result: CompletionResult) => {
      const { response, durationSeconds } = result;
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
  };
}
