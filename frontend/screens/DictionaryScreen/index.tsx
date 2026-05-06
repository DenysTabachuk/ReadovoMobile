import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
  type DimensionValue,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  fetchDictionaryWords,
  fetchDictionaryTest,
  submitDictionaryTestAnswer,
  updateDictionaryWordProgress,
  type DictionaryTest,
  type DictionaryWord,
  type DictionaryWordProgress,
} from '@/api/dictionary';
import {
  ArticleQuizRunner,
  type QuizQuestion,
  type QuizSessionResult,
} from '@/components/articleQuizRunner';
import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { FloatingActionButton } from '@/components/floatingActionButton';
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

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showBanner } = useBanner();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const [test, setTest] = useState<DictionaryTest>();
  const [testResult, setTestResult] = useState<QuizSessionResult | null>(null);
  const [openProgressMenuWordId, setOpenProgressMenuWordId] = useState<string | null>(null);

  const {
    data,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: fetchDictionaryWords,
    queryKey: ['dictionary', 'words'],
  });
  const words = data ?? [];
  const shouldShowInitialLoader = isLoading && words.length === 0;
  const shouldShowErrorState = Boolean(error) && words.length === 0;
  const quizQuestions = useMemo<QuizQuestion[]>(() => {
    if (!test) {
      return [];
    }

    return test.questions.map((question) => ({
      id: question.wordId,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.translation,
      })),
      prompt: `${t('dictionary.test.questionLabel')}: ${question.word}`,
      type: 'single_choice' as const,
    }));
  }, [t, test]);

  const testMutation = useMutation({
    mutationFn: fetchDictionaryTest,
    onSuccess: (nextTest) => {
      setTest(nextTest);
    },
  });

  const answerMutation = useMutation({
    mutationFn: submitDictionaryTestAnswer,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words'] });
    },
  });
  const wordProgressMutation = useMutation({
    mutationFn: ({
      progress,
      wordId,
    }: {
      progress: DictionaryWordProgress;
      wordId: string;
    }) => updateDictionaryWordProgress(wordId, { progress }),
    onError: () => {
      showBanner({
        description: t('dictionary.progressUpdateErrorDescription'),
        durationMs: 4200,
        title: t('dictionary.progressUpdateError'),
        variant: 'error',
      });
    },
    onSuccess: () => {
      setOpenProgressMenuWordId(null);
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words'] });
      if (currentUser?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['achievements-profile', currentUser.id],
        });
      }
    },
  });
  const progressMutation = useMutation({
    mutationFn: async (result: QuizSessionResult) => {
      if (!currentUser?.id) {
        return null;
      }

      const profile = await getAchievementsProfile(currentUser.id);
      const rewardCoins = calculateQuizReward({
        isFirstTestCompleted: profile.progress.testsCompleted === 0,
        percentage: result.percentage,
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
        profile: updatedProfile,
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

  const renderWord = useCallback<ListRenderItem<DictionaryWord>>(
    ({ item }) => {
      const progressColors = getProgressBadgeColors(item.progress, colorScheme);
      const progressRatio = Math.min(
        item.correctAnswersCount / item.requiredCorrectAnswers,
        1,
      );
      const progressPercentage: DimensionValue = `${Math.round(progressRatio * 100)}%`;
      const isProgressMenuOpen = openProgressMenuWordId === item.id;
      const inProgressColors = getProgressBadgeColors('in_progress', colorScheme);
      const isDarkTheme = colorScheme === 'dark';

      return (
        <View style={[styles.wordCard, { borderColor }]}>
          <View style={styles.cardHeader}>
            <View style={styles.wordTitleGroup}>
              <ThemedText type="sectionTitle" style={styles.wordText}>
                {item.word}
              </ThemedText>
              <ThemedText type="bodyStrong" style={styles.translationText}>
                {item.translation}
              </ThemedText>
            </View>
            <View style={styles.progressControl}>
              <Pressable
                disabled={item.progress !== 'learned'}
                onPress={() =>
                  setOpenProgressMenuWordId((current) =>
                    current === item.id ? null : item.id,
                  )
                }
                style={[
                  styles.progressBadge,
                  { backgroundColor: progressColors.backgroundColor },
                ]}>
                <ThemedText
                  type="bodyStrong"
                  style={[styles.progressText, { color: progressColors.textColor }]}>
                  {getProgressLabel(item.progress, t)}
                </ThemedText>
              </Pressable>
              {isProgressMenuOpen ? (
                <View
                  style={[
                    styles.progressMenu,
                    isDarkTheme && styles.progressMenuDark,
                  ]}>
                  <ThemedText
                    style={[
                      styles.progressMenuHint,
                      isDarkTheme && styles.progressMenuHintDark,
                    ]}>
                    {t('dictionary.progressMenuHint')}
                  </ThemedText>
                  <Pressable
                    disabled={wordProgressMutation.isPending}
                    onPress={() =>
                      wordProgressMutation.mutate({
                        progress: 'in_progress',
                        wordId: item.id,
                      })
                    }
                    style={[
                      styles.progressBadge,
                      styles.progressMenuBadge,
                      { backgroundColor: inProgressColors.backgroundColor },
                    ]}>
                    <ThemedText
                      type="bodyStrong"
                      style={[
                        styles.progressText,
                        { color: inProgressColors.textColor },
                      ]}>
                      {t('dictionary.progress.in_progress')}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          <ThemedText type="body" style={styles.contextText}>
            {item.context}
          </ThemedText>
          <View style={styles.learningProgressBlock}>
            <View style={styles.learningProgressTrack}>
              <View
                style={[
                  styles.learningProgressFill,
                  { width: progressPercentage },
                ]}
              />
            </View>
            <ThemedText style={styles.learningProgressText}>
              {`${Math.min(item.correctAnswersCount, item.requiredCorrectAnswers)}/${item.requiredCorrectAnswers}`}
            </ThemedText>
          </View>
        </View>
      );
    },
    [
      borderColor,
      colorScheme,
      currentUser?.id,
      openProgressMenuWordId,
      queryClient,
      t,
      wordProgressMutation,
    ],
  );

  const handleStartTest = useCallback(() => {
    testMutation.mutate();
  }, [testMutation]);

  const handleFinishTest = useCallback((result: QuizSessionResult) => {
    setTestResult(result);
    setTest(undefined);
    void progressMutation.mutateAsync(result);
  }, [progressMutation]);

  const handleRetryTest = useCallback(() => {
    setTestResult(null);
    testMutation.mutate();
  }, [testMutation]);
  const handleDoneTest = useCallback(() => {
    setTestResult(null);
  }, []);
  const handleSubmitQuizAnswer = useCallback(
    async (question: QuizQuestion, selectedOptionIds: string[]) => {
      const selectedOptionId = selectedOptionIds[0];

      if (!selectedOptionId) {
        throw new Error('No answer selected.');
      }

      const result = await answerMutation.mutateAsync({
        selectedOptionId,
        wordId: question.id,
      });

      return {
        correctOptionIds: [result.correctOptionId],
        feedbackText: result.isCorrect
          ? t('dictionary.test.correct')
          : t('dictionary.test.incorrect', {
              translation: result.correctTranslation,
            }),
        isCorrect: result.isCorrect,
      };
    },
    [answerMutation, t],
  );

  if (shouldShowInitialLoader) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('dictionary.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (shouldShowErrorState) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('dictionary.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('dictionary.errorDescription')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('dictionary.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  if (quizQuestions.length > 0) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.testContainer}>
          <ThemedText type="screenTitle">{t('dictionary.test.title')}</ThemedText>
          <ArticleQuizRunner
            onFinish={handleFinishTest}
            onSubmitAnswer={handleSubmitQuizAnswer}
            questions={quizQuestions}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (testResult) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.testContainer}>
          <TestResult
            onDone={handleDoneTest}
            onRetry={handleRetryTest}
            result={testResult}
            shouldUseSafeAreaBottom={false}
            title={t('dictionary.test.title')}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={words}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="sectionTitle" style={styles.centerTitle}>
              {t('dictionary.emptyTitle')}
            </ThemedText>
            <ThemedText type="body" style={styles.centerDescription}>
              {t('dictionary.emptyDescription')}
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="screenTitle">{t('dictionary.title')}</ThemedText>
            <ThemedText type="description" style={styles.description}>
              {t('dictionary.description')}
            </ThemedText>
            {testMutation.error || answerMutation.error ? (
              <ThemedText type="body" style={styles.testError}>
                {testMutation.error
                  ? t('dictionary.test.error')
                  : t('dictionary.test.answerError')}
              </ThemedText>
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
        renderItem={renderWord}
        showsVerticalScrollIndicator={false}
      />
      <FloatingActionButton
        bottomOffset={8}
        disabled={words.length < 4 || testMutation.isPending}
        onPress={handleStartTest}>
        {testMutation.isPending
          ? t('dictionary.test.loading')
          : t('dictionary.test.start')}
      </FloatingActionButton>
    </ScreenContainer>
  );
}

function getProgressLabel(
  progress: DictionaryWordProgress,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return t(`dictionary.progress.${progress}`);
}

function getProgressBadgeColors(
  progress: DictionaryWordProgress,
  colorScheme: ReturnType<typeof useColorScheme>,
): { backgroundColor: string; textColor: string } {
  const isDark = colorScheme === 'dark';

  if (progress === 'learned') {
    return {
      backgroundColor: isDark ? '#173522' : '#dff7e8',
      textColor: isDark ? '#7ee0a0' : '#1f8a4c',
    };
  }

  if (progress === 'in_progress') {
    return {
      backgroundColor: isDark ? '#3a2d14' : '#fff2cc',
      textColor: isDark ? '#ffd36a' : '#9a6700',
    };
  }

  return {
    backgroundColor: isDark ? '#263238' : '#e6f4f8',
    textColor: isDark ? '#7ccce6' : '#0a7ea4',
  };
}
