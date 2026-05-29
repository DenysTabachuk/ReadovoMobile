import {
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ArticleQuizRunner, type QuizSessionResult } from '@/components/articleQuizRunner';
import { ModalSheet } from '@/components/modalSheet';
import { ScreenContainer } from '@/components/screenContainer';
import { TestResult } from '@/components/testResult';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { getArticleQuizSessionKey } from '@/features/articles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';
import { createDictionaryWord } from '@/api/dictionary';
import {
  type ArticleQuizSessionResponse,
  type ArticleVocabularyQuizQuestion,
} from '@/api/wikipedia';
import { useBanner } from '@/components/banner';

import {
  normalizeLevel,
  normalizeMode,
  normalizeTargetLength,
} from './articleQuizParams';
import { DEFAULT_LENGTH, DEFAULT_LEVEL } from './constants';
import { styles } from './styles';
import { useFetchWikipediaArticleDetail } from './useFetchWikipediaArticleDetail';
import { useCompleteArticleQuiz } from './useCompleteArticleQuiz';

export default function ArticleQuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const { currentUser } = useAuth();
  const { showBanner } = useBanner();
  const [quizResult, setQuizResult] = useState<QuizSessionResult | null>(null);
  const [quizAttempt, setQuizAttempt] = useState(0);
  const [isExitQuizConfirmOpen, setIsExitQuizConfirmOpen] = useState(false);
  const [pendingExitAction, setPendingExitAction] =
    useState<NavigationAction | null>(null);
  const [savedVocabularyQuestionIds, setSavedVocabularyQuestionIds] = useState<
    Set<string>
  >(() => new Set());
  const params = useLocalSearchParams<{
    id?: string | string[];
    level?: string | string[];
    mode?: string | string[];
    targetLength?: string | string[];
  }>();
  const rawArticleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawLevel = Array.isArray(params.level) ? params.level[0] : params.level;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const rawTargetLength = Array.isArray(params.targetLength)
    ? params.targetLength[0]
    : params.targetLength;
  const parsedArticleId = Number(rawArticleId);
  const articleId = Number.isFinite(parsedArticleId) ? parsedArticleId : null;
  const quizLevel = normalizeLevel(rawLevel) ?? DEFAULT_LEVEL;
  const quizMode = normalizeMode(rawMode) ?? 'article';
  const quizTargetLength =
    normalizeTargetLength(rawTargetLength) ?? DEFAULT_LENGTH;
  const quizSessionTargetLength =
    quizTargetLength === 'original' ? DEFAULT_LENGTH : quizTargetLength;

  const {
    data: article,
    isError: isArticleError,
    isLoading,
    refetch,
  } = useFetchWikipediaArticleDetail({
    articleId,
  });

  const quizSession = useMemo(() => {
    return queryClient.getQueryData<ArticleQuizSessionResponse>(
      getArticleQuizSessionKey(
        articleId,
        quizMode,
        quizLevel,
        quizSessionTargetLength,
      ),
    );
  }, [articleId, queryClient, quizLevel, quizMode, quizSessionTargetLength]);
  const progressMutation = useCompleteArticleQuiz({
    article,
    currentUserId: currentUser?.id ?? undefined,
    quizLevel,
    quizTargetLength,
  });
  const shouldConfirmExit =
    Boolean(quizSession?.questions?.length) && quizResult === null;

  usePreventRemove(shouldConfirmExit, ({ data }) => {
    setPendingExitAction(data.action);
    setIsExitQuizConfirmOpen(true);
  });
  const saveVocabularyMutation = useMutation({
    mutationFn: (question: ArticleVocabularyQuizQuestion) =>
      createDictionaryWord(currentUser?.id ?? '', {
        context: question.sourceExcerpt ?? article?.title ?? question.term,
        translation: question.translation,
        word: question.term,
      }),
    onError: () => {
      showBanner({
        title: t('dictionary.saveError'),
        variant: 'error',
      });
    },
    onSuccess: (_word, question) => {
      setSavedVocabularyQuestionIds((currentIds) => {
        const nextIds = new Set(currentIds);

        nextIds.add(question.id);

        return nextIds;
      });
      void queryClient.invalidateQueries({
        queryKey: ['dictionary', 'words', currentUser?.id],
      });
      showBanner({
        title: t('dictionary.saved'),
        variant: 'success',
      });
    },
  });
  const renderVocabularySaveAction = useCallback(
    (question: unknown) => {
      if (
        quizMode !== 'vocabulary' ||
        !currentUser?.id ||
        !isArticleVocabularyQuizQuestion(question)
      ) {
        return null;
      }

      const isSaved = savedVocabularyQuestionIds.has(question.id);
      const isSaving =
        saveVocabularyMutation.isPending &&
        saveVocabularyMutation.variables?.id === question.id;

      return (
        <Button
          disabled={isSaved || isSaving}
          onPress={() => saveVocabularyMutation.mutate(question)}
          style={styles.quizFooterButton}
          variant="secondary">
          {isSaved
            ? t('dictionary.saved')
            : isSaving
              ? t('common.loading', { defaultValue: 'Saving...' })
              : t('translation.addToDictionary')}
        </Button>
      );
    },
    [
      currentUser?.id,
      quizMode,
      saveVocabularyMutation,
      savedVocabularyQuestionIds,
      t,
    ],
  );

  useEffect(() => {
    if (!isArticleError) {
      return;
    }

    router.back();
  }, [isArticleError, router]);

  const handleConfirmExitQuiz = useCallback(() => {
    setIsExitQuizConfirmOpen(false);

    if (pendingExitAction) {
      navigation.dispatch(pendingExitAction);
      setPendingExitAction(null);
      return;
    }

    router.back();
  }, [navigation, pendingExitAction, router]);

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
        <Stack.Screen
          options={{
            title:
              quizMode === 'vocabulary'
                ? t('article.quiz.vocabularyKnowledge')
                : t('article.quiz.articleKnowledge'),
          }}
        />
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('article.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (isArticleError) {
    return null;
  }

  if (!article) {
    return (
      <ScreenContainer>
        <Stack.Screen
          options={{
            title:
              quizMode === 'vocabulary'
                ? t('article.quiz.vocabularyKnowledge')
                : t('article.quiz.articleKnowledge'),
          }}
        />
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
      <Stack.Screen
        options={{
          title:
            quizMode === 'vocabulary'
              ? t('article.quiz.vocabularyKnowledge')
              : t('article.quiz.articleKnowledge'),
        }}
      />
      {quizResult ? (
        <TestResult
          onDone={() => router.back()}
          onRetry={() => {
            setQuizResult(null);
            setQuizAttempt((current) => current + 1);
          }}
          result={quizResult}
          shouldShowTitle={false}
          title={
            quizMode === 'vocabulary'
              ? t('article.quiz.vocabularyKnowledge')
              : t('article.quiz.articleKnowledge')
          }
        />
      ) : quizSession?.questions?.length ? (
        <ArticleQuizRunner
          key={`article-quiz-${quizAttempt}`}
          onFinish={(result) => {
            setQuizResult(result);
            void progressMutation.mutateAsync(result);
          }}
          questions={quizSession.questions}
          renderSubmittedQuestionAction={renderVocabularySaveAction}
        />
      ) : (
        <View style={styles.setupContent}>
          <View style={styles.setupBody}>
            <ThemedText type="screenTitle">{article.title}</ThemedText>
            <ThemedText type="description">
              {t('article.quiz.missingGeneratedQuiz')}
            </ThemedText>
          </View>
          <View style={styles.setupFooter}>
            <Button onPress={() => router.back()} style={styles.setupButton}>
              {t('translation.close')}
            </Button>
          </View>
        </View>
      )}
      <ModalSheet
        footer={
          <View style={styles.confirmModalActions}>
            <Button
              onPress={() => {
                setPendingExitAction(null);
                setIsExitQuizConfirmOpen(false);
              }}
              style={styles.confirmModalButton}
              variant="secondary">
              {t('dictionary.test.exitCancel')}
            </Button>
            <Button
              onPress={handleConfirmExitQuiz}
              style={styles.confirmModalButton}>
              {t('dictionary.test.exitConfirm')}
            </Button>
          </View>
        }
        onClose={() => {
          setPendingExitAction(null);
          setIsExitQuizConfirmOpen(false);
        }}
        open={isExitQuizConfirmOpen}
        title={t('dictionary.test.exitTitle')}>
        <ThemedText type="body">
          {t('dictionary.test.exitDescription')}
        </ThemedText>
      </ModalSheet>
    </ScreenContainer>
  );
}

function isArticleVocabularyQuizQuestion(
  question: unknown,
): question is ArticleVocabularyQuizQuestion {
  if (!question || typeof question !== 'object') {
    return false;
  }

  const candidate = question as Partial<ArticleVocabularyQuizQuestion>;

  return Boolean(candidate.term && candidate.translation);
}
