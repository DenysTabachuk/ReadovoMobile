import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ArticleQuizRunner, type QuizSessionResult } from '@/components/articleQuizRunner';
import { ScreenContainer } from '@/components/screenContainer';
import { TestResult } from '@/components/testResult';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { getArticleQuizSessionKey } from '@/features/articles';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';
import { type ArticleQuizSessionResponse } from '@/api/wikipedia';

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
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const { currentUser } = useAuth();
  const [quizResult, setQuizResult] = useState<QuizSessionResult | null>(null);
  const [quizAttempt, setQuizAttempt] = useState(0);
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

  useEffect(() => {
    if (!isArticleError) {
      return;
    }

    router.back();
  }, [isArticleError, router]);

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
    </ScreenContainer>
  );
}
