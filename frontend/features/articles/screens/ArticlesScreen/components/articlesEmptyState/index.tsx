import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { ArticlePersonalFilter } from '../articlesToolbar/types';
import { styles } from './styles';

type ArticlesEmptyStateProps = {
  errorMessageKey?: string | null;
  isError: boolean;
  personalFilter: ArticlePersonalFilter;
  hasActiveContentFilters: boolean;
  isSearchActive: boolean;
  onRetry: () => void;
};

export function ArticlesEmptyState({
  errorMessageKey,
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
          {t(errorMessageKey ?? 'errors.generic')}
        </ThemedText>
        <Button onPress={onRetry}>{t('articles.retry')}</Button>
      </View>
    );

  let titleKey = 'articles.emptyTitle';
  let descriptionKey = 'articles.emptyFilterDescription';

  if (personalFilter === 'saved') {
    titleKey = 'articles.saved.emptyTitle';
    descriptionKey = 'articles.saved.emptyDescription';
  } else if (personalFilter === 'recent') {
    titleKey = 'articles.recent.emptyTitle';
    descriptionKey = 'articles.recent.emptyDescription';
  } else if (hasActiveContentFilters) {
    titleKey = 'articles.emptyFilteredTitle';
    descriptionKey = 'articles.emptyFilteredDescription';
  } else if (isSearchActive) {
    descriptionKey = 'articles.emptySearchDescription';
  }

  return (
    <View style={styles.emptyState}>
      <ThemedText type="sectionTitle" style={styles.centerTitle}>
        {t(titleKey)}
      </ThemedText>
      <ThemedText type="body" style={styles.centerDescription}>
        {t(descriptionKey)}
      </ThemedText>
    </View>
  );
}
