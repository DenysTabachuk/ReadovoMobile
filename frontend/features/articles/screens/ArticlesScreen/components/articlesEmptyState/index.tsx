import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { ArticlePersonalFilter } from '../articlesToolbar/types';
import { styles } from './styles';

type ArticlesEmptyStateProps = {
  isError: boolean;
  personalFilter: ArticlePersonalFilter;
  hasActiveContentFilters: boolean;
  isSearchActive: boolean;
  onRetry: () => void;
};

export function ArticlesEmptyState({
  isError,
  personalFilter,
  hasActiveContentFilters,
  isSearchActive,
  onRetry,
}: ArticlesEmptyStateProps) {
  const { t } = useTranslation();
  if (isError)
    return (
      <View style={styles.emptyState}>
        <ThemedText type="sectionTitle" style={styles.centerTitle}>
          {t('articles.loadErrorTitle')}
        </ThemedText>
        <ThemedText type="body" style={styles.centerDescription}>
          {t('articles.loadErrorDescription')}
        </ThemedText>
        <Button onPress={onRetry}>{t('articles.retry')}</Button>
      </View>
    );

  return (
    <View style={styles.emptyState}>
      <ThemedText type="sectionTitle" style={styles.centerTitle}>
        {personalFilter === 'saved'
          ? t('articles.saved.emptyTitle')
          : personalFilter === 'recent'
            ? t('articles.recent.emptyTitle')
            : hasActiveContentFilters
              ? t('articles.emptyFilteredTitle')
              : t('articles.emptyTitle')}
      </ThemedText>
      <ThemedText type="body" style={styles.centerDescription}>
        {personalFilter === 'saved'
          ? t('articles.saved.emptyDescription')
          : personalFilter === 'recent'
            ? t('articles.recent.emptyDescription')
            : hasActiveContentFilters
              ? t('articles.emptyFilteredDescription')
              : isSearchActive
                ? t('articles.emptySearchDescription')
                : t('articles.emptyFilterDescription')}
      </ThemedText>
    </View>
  );
}
