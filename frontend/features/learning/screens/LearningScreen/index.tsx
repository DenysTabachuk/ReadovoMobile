import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/button';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { CatalogueHeader } from './components/CatalogueHeader';
import { CatalogueList } from './components/CatalogueList';
import { useCatalogueContent } from './hooks/useCatalogueContent';
import { styles } from './styles';
import type { CatalogueTab } from './types';

type LearningCatalogueProps = { topic?: string };

export default function LearningScreen() {
  const { topic } = useLocalSearchParams<{ topic?: string | string[] }>();
  const { t } = useTranslation();
  if (Array.isArray(topic) || topic === '')
    return <ThemedText>{t('learning.topics.loadError')}</ThemedText>;
  return <LearningCatalogue topic={topic} />;
}

function LearningCatalogue({ topic }: LearningCatalogueProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<CatalogueTab>('all');
  const isRootCatalogue = topic === undefined;
  const tab = isRootCatalogue ? selectedTab : 'all';
  const {
    catalogue: { data, isPending, refetch },
    topics,
    lessons,
    hasSearch,
    loadingLibrary,
    libraryError,
    retryLibrary,
    bookmarkDisabled,
    toggleBookmark,
  } = useCatalogueContent({ topic, tab, search });

  function selectTab(nextTab: CatalogueTab) {
    if (tab === nextTab) return;
    setSelectedTab(nextTab);
    setSearch('');
  }

  if (isPending) return <FullScreenLoader />;
  if (!data)
    return (
      <ScrollableScreen>
        <ThemedText>{t('learning.topics.loadError')}</ThemedText>
        <Button onPress={() => void refetch()}>{t('article.retry')}</Button>
      </ScrollableScreen>
    );

  const showLibraryError = libraryError && (tab !== 'all' || !isRootCatalogue);
  const showEmptyState =
    !loadingLibrary &&
    (tab === 'all' || !libraryError) &&
    topics.length === 0 &&
    lessons.length === 0;

  const showFooter = loadingLibrary || showLibraryError || showEmptyState;

  return (
    <>
      {data.topic && <Stack.Screen options={{ title: data.topic.title }} />}
      <CatalogueList
        topics={topics}
        lessons={lessons}
        isRootCatalogue={isRootCatalogue}
        showParentTitle={tab !== 'all'}
        bookmarkDisabled={bookmarkDisabled}
        onToggleBookmark={toggleBookmark}
        header={
          <CatalogueHeader
            isRootCatalogue={isRootCatalogue}
            topicDescription={data.topic?.description}
            tab={tab}
            onSelectTab={selectTab}
            search={search}
            hasSearch={hasSearch}
            onSearchChange={setSearch}
          />
        }
        footer={
          showFooter ? (
            <View style={styles.footer}>
              {loadingLibrary && (
                <ActivityIndicator color={colors.interactive} />
              )}
              {showLibraryError && (
                <View style={styles.libraryError}>
                  <ThemedText>
                    {t('learning.topics.libraryLoadError')}
                  </ThemedText>
                  <Button onPress={retryLibrary}>{t('article.retry')}</Button>
                </View>
              )}
              {showEmptyState && (
                <ThemedText>
                  {t(
                    hasSearch
                      ? 'learning.topics.noResults'
                      : `learning.topics.emptyTab.${tab}`,
                  )}
                </ThemedText>
              )}
            </View>
          ) : null
        }
      />
    </>
  );
}
