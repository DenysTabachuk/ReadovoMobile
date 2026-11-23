import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type { CatalogueTab } from '../../types';
import { CatalogueTabs } from '../CatalogueTabs';
import { CatalogueToolbar } from '../catalogueToolbar';
import { WikipediaArticlesCard } from '../wikipediaArticlesCard';
import { createStyles } from './styles';

type CatalogueHeaderProps = {
  isRootCatalogue: boolean;
  topicDescription?: string;
  tab: CatalogueTab;
  onSelectTab: (tab: CatalogueTab) => void;
  search: string;
  hasSearch: boolean;
  onSearchChange: (search: string) => void;
};

export function CatalogueHeader({
  isRootCatalogue,
  topicDescription,
  tab,
  onSelectTab,
  search,
  hasSearch,
  onSearchChange,
}: CatalogueHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isBrowsingTopics = isRootCatalogue && tab === 'all';

  return (
    <View style={styles.header}>
      <View style={styles.intro}>
        {isRootCatalogue && (
          <ThemedText type="heroTitle">{t('learning.topics.title')}</ThemedText>
        )}
        <ThemedText style={styles.description}>
          {topicDescription ?? t('learning.topics.description')}
        </ThemedText>
      </View>
      <CatalogueToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel={t(
          isBrowsingTopics
            ? 'learning.topics.search'
            : 'learning.topics.searchLessons',
        )}
      />
      {isRootCatalogue && (
        <CatalogueTabs selectedTab={tab} onSelectTab={onSelectTab} />
      )}
      {tab !== 'all' && (
        <ThemedText type="sectionTitle">
          {t(`learning.topics.libraryHeading.${tab}`)}
        </ThemedText>
      )}
      {isBrowsingTopics && !hasSearch && <WikipediaArticlesCard />}
    </View>
  );
}
