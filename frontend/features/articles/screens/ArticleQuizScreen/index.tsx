import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useArticleDetailQuery } from '@/features/articles/api';
import { getArticleErrorMessageKey } from '../../utils/getArticleErrorMessageKey';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { ArticleQuizSession } from './components/articleQuizSession';
import { styles } from './styles';
import type { ArticleQuizRouteParams } from './types';
import { resolveArticleQuizParams } from './utils/resolveArticleQuizParams';

export default function ArticleQuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { showBanner } = useBanner();
  const routeParams = useLocalSearchParams<ArticleQuizRouteParams>();
  const { articleId, ...quizParams } = resolveArticleQuizParams(routeParams);
  const {
    data: article,
    error,
    isError: isArticleError,
    isLoading,
    refetch,
  } = useArticleDetailQuery(articleId);
  const articleErrorMessageKey = error
    ? getArticleErrorMessageKey(error)
    : null;
  useEffect(() => {
    if (isArticleError && articleErrorMessageKey) {
      showBanner({ title: t(articleErrorMessageKey), variant: 'error' });
      router.back();
    }
  }, [isArticleError, articleErrorMessageKey, router, showBanner, t]);
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
              quizParams.quizMode === 'vocabulary'
                ? t('article.quiz.vocabularyKnowledge')
                : t('article.quiz.articleKnowledge'),
          }}
        />
        <View style={styles.centerState}>
          <ActivityIndicator
            color={Colors[colorScheme ?? 'light'].tint}
            size="large"
          />
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
              quizParams.quizMode === 'vocabulary'
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
    <ArticleQuizSession
      key={`${article.id}:${quizParams.quizMode}:${quizParams.quizLevel}:${quizParams.quizSessionTargetLength}`}
      article={article}
      {...quizParams}
    />
  );
}
