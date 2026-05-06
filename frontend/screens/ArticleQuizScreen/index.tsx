import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  fetchWikipediaArticleDetail,
  generateArticleQuiz,
  type SimplifyArticleLevel,
  type SimplifyArticleTargetLength,
} from '@/api/wikipedia';
import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { ArticleQuizRunner, type QuizSessionResult } from '@/components/articleQuizRunner';
import { ScreenContainer } from '@/components/screenContainer';
import { TestResult } from '@/components/testResult';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import {
  getAchievementBadge,
  getAchievementsProfile,
  getNewlyUnlockedAchievements,
  updateAchievementsProgress,
} from '@/features/achievements';
import { calculateQuizReward } from '@/features/quizRewards';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

const DEFAULT_LEVEL: SimplifyArticleLevel = 'A2';
const DEFAULT_LENGTH: SimplifyArticleTargetLength = 'medium';
const TARGET_LENGTH_MAX_SENTENCES: Record<SimplifyArticleTargetLength, number> = {
  short: 5,
  medium: 10,
  long: 16,
};
type ArticleQuizLengthParam = SimplifyArticleTargetLength | 'original';

export default function ArticleQuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showBanner } = useBanner();
  const colorScheme = useColorScheme();
  const { currentUser } = useAuth();
  const [quizResult, setQuizResult] = useState<QuizSessionResult | null>(null);
  const [quizAttempt, setQuizAttempt] = useState(0);
  const params = useLocalSearchParams<{
    id?: string | string[];
    level?: string | string[];
    targetLength?: string | string[];
  }>();
  const rawArticleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawLevel = Array.isArray(params.level) ? params.level[0] : params.level;
  const rawTargetLength = Array.isArray(params.targetLength)
    ? params.targetLength[0]
    : params.targetLength;
  const parsedArticleId = Number(rawArticleId);
  const articleId = Number.isFinite(parsedArticleId) ? parsedArticleId : null;
  const quizLevel = normalizeLevel(rawLevel) ?? DEFAULT_LEVEL;
  const quizTargetLength =
    normalizeTargetLength(rawTargetLength) ?? DEFAULT_LENGTH;

  const { data: article, error, isLoading, refetch } = useQuery({
    enabled: articleId !== null,
    queryFn: async () => {
      if (articleId === null) {
        throw new Error('Invalid article id.');
      }

      return fetchWikipediaArticleDetail(articleId);
    },
    queryKey: ['wikipedia', 'article', articleId],
  });

  const quizMutation = useMutation({
    mutationFn: async () => {
      if (!article) {
        throw new Error('Article is unavailable.');
      }

      const targetLength = resolveEffectiveTargetLength(
        quizTargetLength,
        article.content,
      );

      return generateArticleQuiz({
        level: quizLevel,
        targetLength,
        text: article.content,
        title: article.title,
      });
    },
    onError: () => {
      showBanner({
        title: t('article.quiz.error', { defaultValue: 'Could not generate quiz. Try again.' }),
        variant: 'error',
      });
    },
  });
  const progressMutation = useMutation({
    mutationFn: async (result: QuizSessionResult) => {
      if (!currentUser?.id || !article) {
        return null;
      }

      const profile = await getAchievementsProfile(currentUser.id);
      const rewardCoins = calculateQuizReward({
        isFirstTestCompleted: profile.progress.testsCompleted === 0,
        level: quizLevel,
        percentage: result.percentage,
        targetLength: resolveEffectiveTargetLength(quizTargetLength, article.content),
      });

      const updatedProfile = await updateAchievementsProgress(currentUser.id, {
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
      if (!currentUser?.id) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', currentUser.id],
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

  useEffect(() => {
    if (!article || quizMutation.isPending || quizMutation.data?.questions?.length) {
      return;
    }

    quizMutation.mutate();
  }, [article, quizMutation]);

  if (articleId === null) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('article.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('article.invalidId')}
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.reinforceKnowledge') }} />
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('article.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !article) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.reinforceKnowledge') }} />
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('article.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('article.errorDescription')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('article.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <Stack.Screen options={{ title: t('article.reinforceKnowledge') }} />
      {quizResult ? (
        <TestResult
          onDone={() => router.back()}
          onRetry={() => {
            setQuizResult(null);
            setQuizAttempt((current) => current + 1);
          }}
          result={quizResult}
          shouldShowTitle={false}
          title={t('article.reinforceKnowledge')}
        />
      ) : quizMutation.data?.questions?.length ? (
        <ArticleQuizRunner
          key={`article-quiz-${quizAttempt}`}
          onFinish={(result) => {
            setQuizResult(result);
            void progressMutation.mutateAsync(result);
          }}
          questions={quizMutation.data.questions}
        />
      ) : (
        <View style={styles.setupContent}>
          <View style={styles.setupBody}>
            <ThemedText type="screenTitle">{article.title}</ThemedText>
            <ThemedText type="description">{t('article.quiz.generating', { defaultValue: 'Generating quiz...' })}</ThemedText>
            {quizMutation.isPending ? (
              <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
            ) : null}
          </View>
          <View style={styles.setupFooter}>
            <Button
              disabled={quizMutation.isPending}
              onPress={() => quizMutation.mutate()}
              style={styles.setupButton}>
              {t('article.retry')}
            </Button>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

function normalizeLevel(value?: string): SimplifyArticleLevel | null {
  if (value === 'A1' || value === 'A2' || value === 'B1' || value === 'B2') {
    return value;
  }

  return null;
}

function normalizeTargetLength(
  value?: string,
): ArticleQuizLengthParam | null {
  if (value === 'original') {
    return value;
  }

  if (value === 'short' || value === 'medium' || value === 'long') {
    return value;
  }

  return null;
}

function resolveEffectiveTargetLength(
  targetLength: ArticleQuizLengthParam,
  text: string,
): SimplifyArticleTargetLength {
  if (targetLength !== 'original') {
    return targetLength;
  }

  const sentenceCount = countSentences(text);

  if (sentenceCount <= TARGET_LENGTH_MAX_SENTENCES.short) {
    return 'short';
  }

  if (sentenceCount <= TARGET_LENGTH_MAX_SENTENCES.medium) {
    return 'medium';
  }

  return 'long';
}

function countSentences(text: string): number {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return 0;
  }

  const matches = normalizedText.match(/[.!?]+(?=\s|$)/g);
  return matches?.length ?? 1;
}
