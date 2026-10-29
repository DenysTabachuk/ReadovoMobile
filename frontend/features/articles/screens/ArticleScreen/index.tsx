import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { useArticleDetailQuery } from '@/features/articles/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getArticleErrorMessageKey } from '../../utils/getArticleErrorMessageKey';
import { ActivityIndicator, View } from 'react-native';
import { ArticleReader } from './components/articleReader';
import { styles } from './styles';
import { parseArticleId } from '@/features/articles/utils/parseArticleId';

export default function ArticleScreen() {
  const { t } = useTranslation();
  const tintColor = useThemeColor({}, 'tint');
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const articleId = parseArticleId(params.id);
  const {
    data: article,
    error,
    isLoading,
    refetch,
  } = useArticleDetailQuery(articleId);
  const errorMessageKey = error ? getArticleErrorMessageKey(error) : null;
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
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ActivityIndicator color={tintColor} size="large" />
          <ThemedText type="body">{t('article.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !article) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('article.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t(errorMessageKey ?? 'errors.generic')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('article.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  return <ArticleReader key={article.id} article={article} />;
}
