import {
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  fetchDictionaryTest,
  submitDictionaryTestAnswer,
  type DictionaryTest,
} from '@/api/dictionary';
import { isMockApiEnabled } from '@/api/auth/constants';
import {
  ArticleQuizRunner,
  type QuizQuestion,
  type QuizSessionResult,
} from '@/components/articleQuizRunner';
import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
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
import {
  didCompleteStreakToday,
  getStreakProfile,
  trackLearningActivity,
  type StreakState,
} from '@/features/streak';
import { useBanner } from '@/components/banner';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

export default function DictionaryTestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { showBanner } = useBanner();
  const colorScheme = useColorScheme();
  const [test, setTest] = useState<DictionaryTest>();
  const [testResult, setTestResult] = useState<QuizSessionResult | null>(null);
  const [isExitTestConfirmOpen, setIsExitTestConfirmOpen] = useState(false);
  const [pendingExitAction, setPendingExitAction] =
    useState<NavigationAction | null>(null);
  const userId = currentUser?.id;

  const quizQuestions = useMemo<QuizQuestion[]>(() => {
    if (!test) {
      return [];
    }

    return test.questions.map((question) => ({
      id: question.wordId,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text ?? option.translation,
      })),
      prompt:
        question.prompt || `${t('dictionary.test.questionLabel')}: ${question.word}`,
      type: 'single_choice' as const,
    }));
  }, [t, test]);

  const testMutation = useMutation({
    mutationFn: () => fetchDictionaryTest(userId ?? ''),
    onSuccess: (nextTest) => {
      setTest(nextTest);
    },
  });

  const answerMutation = useMutation({
    mutationFn: (request: { selectedOptionId: string; wordId: string }) =>
      submitDictionaryTestAnswer(userId ?? '', request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words', userId] });
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (result: QuizSessionResult) => {
      if (!userId || !currentUser?.id) {
        return null;
      }

      const profile = await getAchievementsProfile(userId);
      const rewardCoins = calculateQuizReward({
        isFirstTestCompleted: profile.progress.testsCompleted === 0,
        percentage: result.percentage,
      });

      const updatedProfile = await updateAchievementsProgress(currentUser.id, {
        balance: profile.progress.balance + rewardCoins,
        testsCompleted: profile.progress.testsCompleted + 1,
      });
      const previousStreak =
        queryClient.getQueryData<StreakState>(['streak-profile', userId]) ??
        (await getStreakProfile(userId).catch(() => null));
      const streak = await trackLearningActivity(currentUser.id, 'lexical_test_completed');

      return {
        newlyUnlockedAchievements: getNewlyUnlockedAchievements(
          profile.achievements,
          updatedProfile.achievements,
        ),
        profile: updatedProfile,
        rewardCoins,
        shouldShowStreakBanner: didCompleteStreakToday(previousStreak, streak),
        streak,
      };
    },
    onSuccess: (response) => {
      if (!userId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', userId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['streak-profile', userId],
      });

      if (response?.streak) {
        queryClient.setQueryData(['streak-profile', userId], response.streak);
      }

      if (response?.rewardCoins !== undefined) {
        showBanner({
          durationMs: 4200,
          title: t('profile.reward', { count: response.rewardCoins }),
          variant: 'reward',
        });
      }

      if (response?.shouldShowStreakBanner || (isMockApiEnabled() && response?.streak)) {
        showBanner({
          description: t('streak.banner.description', {
            count: response.streak.currentStreak,
          }),
          durationMs: 4200,
          title: t('streak.banner.title'),
          variant: 'streak',
        });
      }

      const achievement = response?.newlyUnlockedAchievements[0];

      if (achievement) {
        showBanner({
          achievement: {
            badge: getAchievementBadge(achievement.badgeKey),
            coinsReward: achievement.coinsReward,
          },
          description: t(achievement.descriptionKey),
          durationMs: 4200,
          title: t(achievement.titleKey),
          variant: 'achievement',
        });
        return;
      }

      if (isMockApiEnabled() && response) {
        showBanner({
          achievement: {
            badge: getAchievementBadge('first-test-completed'),
            coinsReward: 20,
          },
          description: t('profile.achievements.first_test_completed.description'),
          durationMs: 4200,
          title: t('profile.achievements.first_test_completed.title'),
          variant: 'achievement',
        });
      }
    },
  });

  const shouldConfirmExit = quizQuestions.length > 0 && testResult === null;

  usePreventRemove(shouldConfirmExit, ({ data }) => {
    setPendingExitAction(data.action);
    setIsExitTestConfirmOpen(true);
  });

  useEffect(() => {
    testMutation.mutate();
  }, []);

  const handleConfirmExitTest = useCallback(() => {
    setIsExitTestConfirmOpen(false);
    setTest(undefined);

    if (pendingExitAction) {
      navigation.dispatch(pendingExitAction);
      setPendingExitAction(null);
      return;
    }

    router.back();
  }, [navigation, pendingExitAction, router]);

  const handleFinishTest = useCallback(
    (result: QuizSessionResult) => {
      setTestResult(result);
      setTest(undefined);
      void progressMutation.mutateAsync(result);
    },
    [progressMutation],
  );

  const handleRetryTest = useCallback(() => {
    setTestResult(null);
    testMutation.mutate();
  }, [testMutation]);

  const handleSubmitQuizAnswer = useCallback(
    async (question: QuizQuestion, selectedOptionIds: string[]) => {
      const selectedOptionId = selectedOptionIds[0];

      if (!selectedOptionId) {
        throw new Error('dictionary.test.answerError');
      }

      const result = await answerMutation.mutateAsync({
        selectedOptionId,
        wordId: question.id,
      });
      const correctOptionText =
        question.options.find((option) => option.id === result.correctOptionId)
          ?.text ?? result.correctTranslation;

      return {
        correctOptionIds: [result.correctOptionId],
        feedbackText: result.isCorrect
          ? t('dictionary.test.correct')
          : t('dictionary.test.incorrect', {
              translation: correctOptionText,
            }),
        isCorrect: result.isCorrect,
      };
    },
    [answerMutation, t],
  );

  return (
    <ScreenContainer style={styles.container}>
      <Stack.Screen options={{ title: t('dictionary.test.title') }} />
      {testMutation.isPending ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('dictionary.test.loading')}</ThemedText>
        </View>
      ) : testMutation.error ? (
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('dictionary.test.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('dictionary.test.error')}
          </ThemedText>
          <Button onPress={() => testMutation.mutate()}>
            {t('dictionary.retry')}
          </Button>
        </View>
      ) : testResult ? (
        <TestResult
          onDone={() => router.back()}
          onRetry={handleRetryTest}
          result={testResult}
          shouldShowTitle={false}
          title={t('dictionary.test.title')}
        />
      ) : quizQuestions.length > 0 ? (
        <ArticleQuizRunner
          onFinish={handleFinishTest}
          onSubmitAnswer={handleSubmitQuizAnswer}
          questions={quizQuestions}
        />
      ) : null}
      <ModalSheet
        footer={
          <View style={styles.confirmModalActions}>
            <Button
              onPress={() => {
                setPendingExitAction(null);
                setIsExitTestConfirmOpen(false);
              }}
              style={styles.confirmModalButton}
              variant="secondary">
              {t('dictionary.test.exitCancel')}
            </Button>
            <Button
              onPress={handleConfirmExitTest}
              style={styles.confirmModalButton}>
              {t('dictionary.test.exitConfirm')}
            </Button>
          </View>
        }
        onClose={() => {
          setPendingExitAction(null);
          setIsExitTestConfirmOpen(false);
        }}
        open={isExitTestConfirmOpen}
        title={t('dictionary.test.exitTitle')}>
        <ThemedText type="body">
          {t('dictionary.test.exitDescription')}
        </ThemedText>
      </ModalSheet>
    </ScreenContainer>
  );
}
