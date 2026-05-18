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
import { Ionicons } from '@expo/vector-icons';

import {
  fetchDictionaryWords,
  fetchDictionaryTest,
  submitDictionaryTestAnswer,
  updateDictionaryWordProgress,
  type DictionaryTest,
  type DictionaryWord,
  type DictionaryWordProgress,
} from '@/api/dictionary';
import { isMockApiEnabled } from '@/api/auth/constants';
import {
  ArticleQuizRunner,
  type QuizQuestion,
  type QuizSessionResult,
} from '@/components/articleQuizRunner';
import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { PronunciationButton } from '@/components/pronunciationButton';
import { useBanner } from '@/components/banner';
import { FloatingActionButton } from '@/components/floatingActionButton';
import { ScreenContainer } from '@/components/screenContainer';
import { SegmentedToggle } from '@/components/segmentedToggle';
import { TestResult } from '@/components/testResult';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/iconSymbol';
import { Colors } from '@/constants/theme';
import {
  getAchievementBadge,
  getAchievementsProfile,
  getNewlyUnlockedAchievements,
  updateAchievementsProgress,
} from '@/features/achievements';
import { TranslationCards } from '@/features/translations/components/translationCards';
import { useWordTranslation } from '@/features/translations/hooks/useWordTranslation';
import { calculateQuizReward } from '@/features/quizRewards';
import {
  didCompleteStreakToday,
  getStreakProfile,
  trackLearningActivity,
  type StreakState,
} from '@/features/streak';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

type DictionaryFilter = 'all' | 'phrases' | 'words';
type DictionaryProgressFilter = 'all' | DictionaryWordProgress;
type ProgressFilterOption = {
  label: string;
  value: DictionaryProgressFilter;
};

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showBanner } = useBanner();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const hintIconColor = useThemeColor(
    { dark: '#7ccce6', light: '#0a7ea4' },
    'tint',
  );
  const testHintBackgroundColor = useThemeColor(
    { dark: '#151718', light: '#ffffff' },
    'background',
  );
  const testHintBorderColor = useThemeColor(
    { dark: '#2d3336', light: '#d0d7de' },
    'icon',
  );
  const testHintDescriptionColor = useThemeColor(
    { dark: '#9ba1a6', light: '#687076' },
    'text',
  );
  const [test, setTest] = useState<DictionaryTest>();
  const [testResult, setTestResult] = useState<QuizSessionResult | null>(null);
  const [openProgressMenuWordId, setOpenProgressMenuWordId] = useState<string | null>(null);
  const [isProgressFilterOpen, setIsProgressFilterOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<DictionaryWord | null>(null);
  const [activeFilter, setActiveFilter] = useState<DictionaryFilter>('all');
  const [activeProgressFilter, setActiveProgressFilter] =
    useState<DictionaryProgressFilter>('all');
  const userId = currentUser?.id;

  const {
    data,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchDictionaryWords(userId ?? ''),
    queryKey: ['dictionary', 'words', userId],
  });
  const words = data ?? [];
  const filteredWords = useMemo(() => {
    return words.filter((word) => {
      if (activeProgressFilter !== 'all' && word.progress !== activeProgressFilter) {
        return false;
      }

      if (activeFilter === 'all') {
        return true;
      }

      const wordCount = countWords(word.word);
      return activeFilter === 'words' ? wordCount === 1 : wordCount > 1;
    });
  }, [activeFilter, activeProgressFilter, words]);
  const filterOptions = useMemo(
    () => [
      { label: t('dictionary.filter.all'), value: 'all' as const },
      { label: t('dictionary.filter.words'), value: 'words' as const },
      { label: t('dictionary.filter.phrases'), value: 'phrases' as const },
    ],
    [t],
  );
  const progressFilterOptions = useMemo<ProgressFilterOption[]>(
    () => [
      { label: t('dictionary.filter.all'), value: 'all' },
      { label: t('dictionary.progress.new'), value: 'new' },
      { label: t('dictionary.progress.in_progress'), value: 'in_progress' },
      { label: t('dictionary.progress.learned'), value: 'learned' },
    ],
    [t],
  );
  const {
    data: selectedWordTranslation,
    error: selectedWordTranslationError,
    isFetching: isSelectedWordTranslationLoading,
  } = useWordTranslation({
    context: selectedWord?.context,
    enabled: selectedWord !== null,
    queryScope: `dictionary-word-${selectedWord?.id ?? ''}`,
    word: selectedWord?.word,
  });
  const remainingWordsForTest = Math.max(0, 4 - words.length);
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
    mutationFn: () => fetchDictionaryTest(userId ?? ''),
    onSuccess: (nextTest) => {
      setTest(nextTest);
    },
  });

  const answerMutation = useMutation({
    mutationFn: (request: { selectedOptionId: string; wordId: string }) =>
      submitDictionaryTestAnswer(userId ?? '', request),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words', userId] });
    },
  });
  const wordProgressMutation = useMutation({
    mutationFn: ({
      progress,
      wordId,
    }: {
      progress: DictionaryWordProgress;
      wordId: string;
    }) => updateDictionaryWordProgress(userId ?? '', wordId, { progress }),
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
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words', userId] });
      if (currentUser?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['achievements-profile', currentUser.id],
        });
      }
    },
  });
  const progressMutation = useMutation({
    mutationFn: async (result: QuizSessionResult) => {
      if (!userId) {
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
            <Pressable
              onPress={() => setSelectedWord(item)}
              style={styles.wordTitleGroup}>
              <ThemedText type="sectionTitle" style={styles.wordText}>
                {item.word}
              </ThemedText>
              <ThemedText type="body" style={styles.wordPreviewText}>
                {item.translation}
              </ThemedText>
            </Pressable>
            <View style={styles.progressControl}>
              <Pressable
                disabled={item.progress !== 'learned'}
                onPress={() => {
                  setOpenProgressMenuWordId((current) =>
                    current === item.id ? null : item.id,
                  );
                }}
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
                    onPress={() => {
                      wordProgressMutation.mutate({
                        progress: 'in_progress',
                        wordId: item.id,
                      });
                    }}
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
          <View style={styles.cardTapHint}>
            <Ionicons
              color={Colors[colorScheme ?? 'light'].icon}
              name="open-outline"
              size={13}
            />
            <ThemedText type="description" style={styles.cardTapHintText}>
              {t('dictionary.tapHint')}
            </ThemedText>
          </View>
        </View>
      );
    },
    [
      borderColor,
      colorScheme,
      openProgressMenuWordId,
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
        throw new Error('dictionary.test.answerError');
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
        data={filteredWords}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="sectionTitle" style={styles.centerTitle}>
              {words.length > 0
                ? t('dictionary.emptyFilteredTitle')
                : t('dictionary.emptyTitle')}
            </ThemedText>
            <ThemedText type="body" style={styles.centerDescription}>
              {words.length > 0
                ? t('dictionary.emptyFilteredDescription')
                : t('dictionary.emptyDescription')}
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="screenTitle">{t('dictionary.title')}</ThemedText>
            <ThemedText type="description" style={styles.description}>
              {t('dictionary.description')}
            </ThemedText>
            <SegmentedToggle
              onChange={setActiveFilter}
              options={filterOptions}
              selectedValue={activeFilter}
            />
            <ProgressFilterDropdown
              colorScheme={colorScheme}
              label={t('dictionary.progressFilterLabel')}
              onClose={() => setIsProgressFilterOpen(false)}
              onOpen={() => setIsProgressFilterOpen(true)}
              onSelect={setActiveProgressFilter}
              open={isProgressFilterOpen}
              options={progressFilterOptions}
              selectedValue={activeProgressFilter}
              title={t('dictionary.progressFilterTitle')}
            />
            {testMutation.error || answerMutation.error ? (
              <ThemedText type="body" style={styles.testError}>
                {testMutation.error
                  ? t('dictionary.test.error')
                  : t('dictionary.test.answerError')}
              </ThemedText>
            ) : null}
          </View>
        }
        ListFooterComponent={
          filteredWords.length > 0 && words.length < 4 ? (
            <View
              style={[
                styles.testHintCard,
                {
                  backgroundColor: testHintBackgroundColor,
                  borderColor: testHintBorderColor,
                },
              ]}>
              <View style={styles.testHintHeader}>
                <IconSymbol
                  color={hintIconColor}
                  name="info.circle.fill"
                  size={18}
                />
                <ThemedText type="bodyStrong" style={styles.testHintTitle}>
                  {t('dictionary.test.disabledTitle')}
                </ThemedText>
              </View>
              <ThemedText
                type="body"
                style={[
                  styles.testHintDescription,
                  { color: testHintDescriptionColor },
                ]}>
                {t('dictionary.test.disabledDescription', {
                  count: remainingWordsForTest,
                })}
              </ThemedText>
            </View>
          ) : null
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
      {filteredWords.length > 0 ? (
        <FloatingActionButton
          bottomOffset={8}
          disabled={words.length < 4 || testMutation.isPending}
          onPress={handleStartTest}>
          {testMutation.isPending
            ? t('dictionary.test.loading')
            : t('dictionary.test.start')}
        </FloatingActionButton>
      ) : null}
      <ModalSheet
        modalProps={{ presentationStyle: 'overFullScreen' }}
        onClose={() => setSelectedWord(null)}
        open={selectedWord !== null}
        showHandle
        title={selectedWord?.word ?? t('translation.titleFallback')}>
        <PronunciationButton word={selectedWord?.word} />
        {selectedWordTranslationError ? (
          <ThemedText type="body">{t('translation.error')}</ThemedText>
        ) : null}
        <TranslationCards
          baseTranslation={
            selectedWordTranslation?.baseTranslation ?? selectedWord?.translation
          }
          context={selectedWord?.context}
          contextTranslation={selectedWordTranslation?.contextTranslation}
          contextualTranslation={selectedWordTranslation?.contextualTranslation}
          isContextLoading={isSelectedWordTranslationLoading}
          resetKey={selectedWord?.id}
          translation={selectedWordTranslation?.translation ?? selectedWord?.translation}
        />
      </ModalSheet>
    </ScreenContainer>
  );
}

type ProgressFilterDropdownProps = {
  colorScheme: ReturnType<typeof useColorScheme>;
  label: string;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (value: DictionaryProgressFilter) => void;
  open: boolean;
  options: ProgressFilterOption[];
  selectedValue: DictionaryProgressFilter;
  title: string;
};

function ProgressFilterDropdown({
  colorScheme,
  label,
  onClose,
  onOpen,
  onSelect,
  open,
  options,
  selectedValue,
  title,
}: ProgressFilterDropdownProps) {
  const selectedOption = options.find((option) => option.value === selectedValue);
  const borderColor = useThemeColor({ dark: '#3a4348', light: '#d0d7de' }, 'icon');
  const buttonBackgroundColor = useThemeColor(
    { dark: '#202425', light: '#f5f7fa' },
    'background',
  );
  const optionBackgroundColor = useThemeColor(
    { dark: '#151718', light: '#ffffff' },
    'background',
  );
  const selectedBackgroundColor = useThemeColor(
    { dark: '#123847', light: '#e8f5f9' },
    'background',
  );
  const selectedBorderColor = useThemeColor(
    { dark: '#67c6e3', light: '#0a7ea4' },
    'tint',
  );
  const chevronColor = useThemeColor({ dark: '#9ba1a6', light: '#687076' }, 'icon');

  const handleSelect = useCallback(
    (value: DictionaryProgressFilter) => {
      onSelect(value);
      onClose();
    },
    [onClose, onSelect],
  );

  return (
    <>
      <View style={styles.progressFilterField}>
        <ThemedText type="bodyStrong">{label}</ThemedText>
        <Pressable
          onPress={onOpen}
          style={[
            styles.progressFilterButton,
            { backgroundColor: buttonBackgroundColor, borderColor },
          ]}>
          {selectedValue === 'all' ? (
            <ThemedText style={styles.progressFilterAllText} type="bodyStrong">
              {selectedOption?.label ?? selectedValue}
            </ThemedText>
          ) : (
            <ProgressStatusBadge
              colorScheme={colorScheme}
              label={selectedOption?.label ?? selectedValue}
              progress={selectedValue}
            />
          )}
          <Ionicons color={chevronColor} name="chevron-down" size={18} />
        </Pressable>
      </View>

      <ModalSheet onClose={onClose} open={open} title={title}>
        <View style={styles.progressFilterOptions}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={[
                  styles.progressFilterOption,
                  { backgroundColor: optionBackgroundColor, borderColor },
                  isSelected
                    ? {
                        backgroundColor: selectedBackgroundColor,
                        borderColor: selectedBorderColor,
                      }
                    : null,
                ]}>
                {option.value === 'all' ? (
                  <ThemedText style={styles.progressFilterAllText} type="bodyStrong">
                    {option.label}
                  </ThemedText>
                ) : (
                  <ProgressStatusBadge
                    colorScheme={colorScheme}
                    label={option.label}
                    progress={option.value}
                  />
                )}
                {isSelected ? (
                  <Ionicons color={selectedBorderColor} name="checkmark-circle" size={20} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>
    </>
  );
}

type ProgressStatusBadgeProps = {
  colorScheme: ReturnType<typeof useColorScheme>;
  label: string;
  progress: DictionaryWordProgress;
};

function ProgressStatusBadge({
  colorScheme,
  label,
  progress,
}: ProgressStatusBadgeProps) {
  const progressColors = getProgressBadgeColors(progress, colorScheme);

  return (
    <View
      style={[
        styles.progressBadge,
        styles.progressFilterBadge,
        { backgroundColor: progressColors.backgroundColor },
      ]}>
      <ThemedText
        type="bodyStrong"
        style={[styles.progressText, { color: progressColors.textColor }]}>
        {label}
      </ThemedText>
    </View>
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

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
