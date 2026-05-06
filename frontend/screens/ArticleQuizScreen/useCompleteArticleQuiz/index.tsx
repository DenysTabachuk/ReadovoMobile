import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  type SimplifyArticleLevel,
  type WikipediaArticleDetail,
} from '@/api/wikipedia';
import { useBanner } from '@/components/banner';
import { type QuizSessionResult } from '@/components/articleQuizRunner';
import {
  getAchievementBadge,
  getAchievementsProfile,
  getNewlyUnlockedAchievements,
  updateAchievementsProgress,
} from '@/features/achievements';
import { calculateQuizReward } from '@/features/quizRewards';

import { resolveEffectiveTargetLength } from '../resolveEffectiveArticleLength';
import { type ArticleQuizLengthParam } from '../types';

type UseCompleteArticleQuizParams = {
  article?: WikipediaArticleDetail;
  currentUserId?: string;
  quizLevel: SimplifyArticleLevel;
  quizTargetLength: ArticleQuizLengthParam;
};

export function useCompleteArticleQuiz({
  article,
  currentUserId,
  quizLevel,
  quizTargetLength,
}: UseCompleteArticleQuizParams) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showBanner } = useBanner();

  return useMutation({
    mutationFn: async (result: QuizSessionResult) => {
      if (!currentUserId || !article) {
        return null;
      }

      const profile = await getAchievementsProfile(currentUserId);
      const rewardCoins = calculateQuizReward({
        isFirstTestCompleted: profile.progress.testsCompleted === 0,
        level: quizLevel,
        percentage: result.percentage,
        targetLength: resolveEffectiveTargetLength(
          quizTargetLength,
          article.content,
        ),
      });

      const updatedProfile = await updateAchievementsProgress(currentUserId, {
        balance: profile.progress.balance + rewardCoins,
        testsCompleted: profile.progress.testsCompleted + 1,
      });

      return {
        newlyUnlockedAchievements: getNewlyUnlockedAchievements(
          profile.achievements,
          updatedProfile.achievements,
        ),
        rewardCoins,
      };
    },
    onSuccess: (response) => {
      if (!currentUserId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', currentUserId],
      });

      const achievement = response?.newlyUnlockedAchievements[0];

      if (achievement) {
        showBanner({
          achievement: {
            badge: getAchievementBadge(achievement.badgeKey),
            coinsReward: achievement.coinsReward,
          },
          description: t(achievement.descriptionKey),
          durationMs: 5200,
          title: t(achievement.titleKey),
          variant: 'achievement',
        });
        return;
      }

      if (response?.rewardCoins !== undefined) {
        showBanner({
          durationMs: 4200,
          title: t('profile.reward', { count: response.rewardCoins }),
          variant: 'reward',
        });
      }
    },
  });
}
