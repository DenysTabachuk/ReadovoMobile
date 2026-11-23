import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { LearningEntry } from '@/api/generated/transport';
import { Button } from '@/components/button';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { useLearningCatalogueQuery } from '../../api/queries/useLearningCatalogueQuery';
import { useLessonParentCatalogues } from '../../api/queries/useLessonParentCatalogues';
import { useLessonLibrary } from '../../hooks/useLessonLibrary';
import { CatalogueToolbar } from './components/catalogueToolbar';
import { CatalogueCard } from './components/catalogueCard';
import { WikipediaArticlesCard } from './components/wikipediaArticlesCard';
import { createStyles } from './styles';

type TopicCatalogueProps = { topic?: string };
const TABS = ['all', 'saved', 'completed'] as const;
type CatalogueTab = (typeof TABS)[number];

export default function LearningScreen() {
  const { topic } = useLocalSearchParams<{ topic?: string | string[] }>();
  const { t } = useTranslation();
  if (Array.isArray(topic) || topic === '')
    return <ThemedText>{t('learning.topics.loadError')}</ThemedText>;
  return <TopicCatalogue topic={topic} />;
}

function TopicCatalogue({ topic }: TopicCatalogueProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isPending, refetch } = useLearningCatalogueQuery(topic);
  const { query: library, mutation: bookmark } = useLessonLibrary();
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<CatalogueTab>('all');
  const tab = topic === undefined ? selectedTab : 'all';
  const filtered =
    library.data?.filter((entry) => tab !== 'all' && entry[tab]) ?? [];
  const parentCatalogues = useLessonParentCatalogues([
    ...new Set(filtered.map((entry) => entry.topic)),
  ]);
  if (isPending) return <FullScreenLoader />;
  if (!data)
    return (
      <ScrollableScreen>
        <ThemedText>{t('learning.topics.loadError')}</ThemedText>
        <Button onPress={() => void refetch()}>{t('article.retry')}</Button>
      </ScrollableScreen>
    );
  const renderTopic = (entry: LearningEntry) => (
    <CatalogueCard
      key={entry.slug}
      entry={entry}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/(learning)/topics/[topic]',
          params: { topic: entry.slug },
        })
      }
    />
  );
  const renderLesson = (entry: LearningEntry, parent: LearningEntry) => {
    const state = library.data?.find((item) => item.slug === entry.slug);
    const saved = state?.saved ?? false;
    return (
      <CatalogueCard
        key={entry.slug}
        entry={entry}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/(learning)/lessons/[slug]',
            params: { slug: entry.slug },
          })
        }
        lesson={{
          parentTitle: tab === 'all' ? undefined : parent.title,
          saved,
          completed: state?.completed ?? false,
          bookmarkDisabled: !library.data || bookmark.isPending,
          onToggleSaved: () =>
            bookmark.mutate({
              slug: entry.slug,
              topic: parent.slug,
              flag: 'saved',
              value: !saved,
            }),
        }}
      />
    );
  };
  const term = search.trim().toLocaleLowerCase();
  const showWikipediaArticlesCard =
    topic === undefined && tab === 'all' && !term;
  const matchesSearch = (entry: LearningEntry) =>
    entry.title.toLocaleLowerCase().includes(term) ||
    entry.description.toLocaleLowerCase().includes(term);
  const topics = tab === 'all' ? data.topics.filter(matchesSearch) : [];
  const catalogueByTopic = new Map(
    parentCatalogues.flatMap(({ data: catalogue }) =>
      catalogue?.topic ? [[catalogue.topic.slug, catalogue] as const] : [],
    ),
  );
  const lessonCards = [];
  if (tab === 'all') {
    const parent = data.topic;
    if (parent)
      lessonCards.push(
        ...data.lessons
          .filter(matchesSearch)
          .map((lesson) => renderLesson(lesson, parent)),
      );
  } else {
    for (const entry of filtered) {
      const catalogue = catalogueByTopic.get(entry.topic);
      const parent = catalogue?.topic;
      const lesson = catalogue?.lessons.find(({ slug }) => slug === entry.slug);
      if (
        parent &&
        lesson &&
        (matchesSearch(lesson) ||
          parent.title.toLocaleLowerCase().includes(term))
      ) {
        lessonCards.push(renderLesson(lesson, parent));
      }
    }
  }
  const loadingLibrary =
    tab !== 'all' &&
    (library.isPending || parentCatalogues.some((query) => query.isPending));
  const libraryError =
    library.isError || parentCatalogues.some((query) => query.isError);
  return (
    <ScrollableScreen
      edges={topic === undefined ? ['top'] : []}
      contentContainerStyle={[
        styles.content,
        topic !== undefined && styles.nestedContent,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {data.topic && <Stack.Screen options={{ title: data.topic.title }} />}
      <View style={styles.header}>
        {topic === undefined && (
          <ThemedText type="heroTitle">{t('learning.topics.title')}</ThemedText>
        )}
        <ThemedText style={styles.secondary}>
          {data.topic?.description ?? t('learning.topics.description')}
        </ThemedText>
      </View>
      <CatalogueToolbar
        search={search}
        onSearchChange={setSearch}
        searchLabel={t(
          tab === 'all' && !topic
            ? 'learning.topics.search'
            : 'learning.topics.searchLessons',
        )}
      />
      {topic === undefined && (
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityLabel={t(`learning.topics.tabs.${item}`)}
              accessibilityState={{ selected: tab === item }}
              onPress={() => {
                if (item !== tab) {
                  setSelectedTab(item);
                  setSearch('');
                }
              }}
              style={[styles.tab, tab === item && styles.activeTab]}
            >
              <ThemedText
                type="bodyStrong"
                style={[styles.tabText, tab === item && styles.activeTabText]}
              >
                {t(`learning.topics.tabs.${item}`)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
      {tab !== 'all' && (
        <ThemedText type="sectionTitle">
          {t(`learning.topics.libraryHeading.${tab}`)}
        </ThemedText>
      )}
      {showWikipediaArticlesCard && <WikipediaArticlesCard />}
      {topics.map(renderTopic)}
      {lessonCards}
      {loadingLibrary && <ActivityIndicator color={colors.interactive} />}
      {libraryError && (tab !== 'all' || topic !== undefined) && (
        <View style={styles.header}>
          <ThemedText>{t('learning.topics.libraryLoadError')}</ThemedText>
          <Button
            onPress={() => {
              if (library.isError) void library.refetch();
              for (const query of parentCatalogues)
                if (query.isError) void query.refetch();
            }}
          >
            {t('article.retry')}
          </Button>
        </View>
      )}
      {bookmark.isError && (
        <ThemedText accessibilityRole="alert">
          {t('learning.topics.libraryWriteError')}
        </ThemedText>
      )}
      {!loadingLibrary &&
        !(tab !== 'all' && libraryError) &&
        topics.length === 0 &&
        lessonCards.length === 0 && (
          <ThemedText>
            {t(
              term
                ? 'learning.topics.noResults'
                : `learning.topics.emptyTab.${tab}`,
            )}
          </ThemedText>
        )}
    </ScrollableScreen>
  );
}
