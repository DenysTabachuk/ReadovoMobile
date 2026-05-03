import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  fetchDictionaryWords,
  fetchDictionaryTest,
  submitDictionaryTestAnswer,
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryTestQuestionOption,
  type DictionaryWord,
  type DictionaryWordProgress,
} from '@/api/dictionary';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const [test, setTest] = useState<DictionaryTest>();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerResult, setAnswerResult] = useState<DictionaryTestAnswerResult>();
  const [selectedOptionId, setSelectedOptionId] = useState<string>();

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
  const currentQuestion = test?.questions[questionIndex];
  const isLastQuestion = questionIndex === (test?.questions.length ?? 0) - 1;
  const testProgressLabel = useMemo(() => {
    if (!test) {
      return '';
    }

    return t('dictionary.test.progress', {
      current: questionIndex + 1,
      total: test.questions.length,
    });
  }, [questionIndex, t, test]);

  const testMutation = useMutation({
    mutationFn: fetchDictionaryTest,
    onSuccess: (nextTest) => {
      setTest(nextTest);
      setQuestionIndex(0);
      setAnswerResult(undefined);
      setSelectedOptionId(undefined);
    },
  });

  const answerMutation = useMutation({
    mutationFn: submitDictionaryTestAnswer,
    onSuccess: (result) => {
      setAnswerResult(result);
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words'] });
    },
  });

  const renderWord = useCallback<ListRenderItem<DictionaryWord>>(
    ({ item }) => {
      const progressColors = getProgressBadgeColors(item.progress, colorScheme);

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
            <View
              style={[
                styles.progressBadge,
                { backgroundColor: progressColors.backgroundColor },
              ]}>
              <ThemedText
                type="bodyStrong"
                style={[styles.progressText, { color: progressColors.textColor }]}>
                {getProgressLabel(item.progress, t)}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="body" style={styles.contextText}>
            {item.context}
          </ThemedText>
        </View>
      );
    },
    [borderColor, colorScheme, t],
  );

  const handleStartTest = useCallback(() => {
    testMutation.mutate();
  }, [testMutation]);

  const handleSelectOption = useCallback(
    (option: DictionaryTestQuestionOption) => {
      if (!currentQuestion || answerResult || answerMutation.isPending) {
        return;
      }

      setSelectedOptionId(option.id);
      answerMutation.mutate({
        selectedOptionId: option.id,
        wordId: currentQuestion.wordId,
      });
    },
    [answerMutation, answerResult, currentQuestion],
  );

  const handleNextQuestion = useCallback(() => {
    if (!test || !answerResult) {
      return;
    }

    if (isLastQuestion) {
      setTest(undefined);
      setQuestionIndex(0);
    } else {
      setQuestionIndex((currentIndex) => currentIndex + 1);
    }

    setAnswerResult(undefined);
    setSelectedOptionId(undefined);
  }, [answerResult, isLastQuestion, test]);

  const handleCloseTest = useCallback(() => {
    setTest(undefined);
    setQuestionIndex(0);
    setAnswerResult(undefined);
    setSelectedOptionId(undefined);
  }, []);

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

  if (currentQuestion) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.testContainer}>
          <View style={styles.testHeader}>
            <View style={styles.wordTitleGroup}>
              <ThemedText type="screenTitle">{t('dictionary.test.title')}</ThemedText>
              <ThemedText type="description">{testProgressLabel}</ThemedText>
            </View>
            <Button onPress={handleCloseTest} variant="secondary">
              {t('dictionary.test.close')}
            </Button>
          </View>

          <View style={[styles.testCard, { borderColor }]}>
            <ThemedText type="description">{t('dictionary.test.questionLabel')}</ThemedText>
            <ThemedText type="screenTitle" style={styles.questionWord}>
              {currentQuestion.word}
            </ThemedText>

            <View style={styles.optionsList}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = answerResult?.correctOptionId === option.id;
                const isWrongSelection = Boolean(answerResult) && isSelected && !isCorrect;

                return (
                  <Button
                    disabled={Boolean(answerResult) || answerMutation.isPending}
                    key={option.id}
                    onPress={() => handleSelectOption(option)}
                    style={[
                      styles.optionButton,
                      isCorrect ? styles.correctOption : null,
                      isWrongSelection ? styles.wrongOption : null,
                    ]}
                    textStyle={[
                      styles.optionText,
                      isCorrect || isWrongSelection ? styles.answeredOptionText : null,
                    ]}
                    variant="secondary">
                    {`${String.fromCharCode(65 + index)}) ${option.translation}`}
                  </Button>
                );
              })}
            </View>

            {answerMutation.isPending ? (
              <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} />
            ) : null}

            {answerResult ? (
              <View style={styles.answerResult}>
                <ThemedText type="bodyStrong">
                  {answerResult.isCorrect
                    ? t('dictionary.test.correct')
                    : t('dictionary.test.incorrect', {
                        translation: answerResult.correctTranslation,
                      })}
                </ThemedText>
                <Button onPress={handleNextQuestion}>
                  {isLastQuestion ? t('dictionary.test.finish') : t('dictionary.test.next')}
                </Button>
              </View>
            ) : null}
          </View>
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
            <Button
              disabled={words.length < 4 || testMutation.isPending}
              onPress={handleStartTest}
              style={styles.startTestButton}>
              {testMutation.isPending
                ? t('dictionary.test.loading')
                : t('dictionary.test.start')}
            </Button>
            {testMutation.error ? (
              <ThemedText type="body" style={styles.testError}>
                {t('dictionary.test.error')}
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
