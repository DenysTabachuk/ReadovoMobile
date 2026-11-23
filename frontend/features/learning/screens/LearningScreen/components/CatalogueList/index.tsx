import { router } from 'expo-router';
import { useCallback, useRef, useState, type ReactElement } from 'react';
import { FlatList, View, type FlatListProps } from 'react-native';
import type { LearningEntry } from '@/api/generated/transport';
import { ScreenContainer } from '@/components/screenContainer';
import { usePrefetchLearningMedia } from '@/features/learningMedia';
import type { CatalogueLesson } from '../../types';
import { LessonCard } from '../LessonCard';
import { TopicCard } from '../TopicCard';
import { styles } from './styles';

type CatalogueRow =
  | { kind: 'topic'; topic: LearningEntry }
  | { kind: 'lesson'; item: CatalogueLesson };

type CatalogueListProps = {
  topics: LearningEntry[];
  lessons: CatalogueLesson[];
  isRootCatalogue: boolean;
  header: ReactElement;
  footer: ReactElement | null;
  showParentTitle: boolean;
  bookmarkDisabled: boolean;
  onToggleBookmark: (item: CatalogueLesson) => void;
};

const MAX_VISIBLE_COVERS_TO_PREFETCH = 2;
const COVER_VIEWABILITY = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 120,
};

function CatalogueSeparator() {
  return <View style={styles.separator} />;
}

export function CatalogueList({
  topics,
  lessons,
  isRootCatalogue,
  header,
  footer,
  showParentTitle,
  bookmarkDisabled,
  onToggleBookmark,
}: CatalogueListProps) {
  const [visibleCoverUrls, setVisibleCoverUrls] = useState<string[]>([]);
  const viewabilityConfig = useRef(COVER_VIEWABILITY).current;
  const prefetchCover = usePrefetchLearningMedia(visibleCoverUrls, false);
  const handleVisibleRows = useCallback<
    NonNullable<FlatListProps<CatalogueRow>['onViewableItemsChanged']>
  >(({ viewableItems }) => {
    const urls = new Set<string>();
    for (const { item } of viewableItems) {
      if (item.kind !== 'lesson' || item.item.lesson.coverImageUrl === null)
        continue;
      urls.add(item.item.lesson.coverImageUrl);
      if (urls.size === MAX_VISIBLE_COVERS_TO_PREFETCH) break;
    }
    const next = [...urls];
    setVisibleCoverUrls((current) => {
      const sameUrls =
        current.length === next.length &&
        current.every((url, index) => url === next[index]);
      return sameUrls ? current : next;
    });
  }, []);
  const rows: CatalogueRow[] = [
    ...topics.map((topic): CatalogueRow => ({ kind: 'topic', topic })),
    ...lessons.map((item): CatalogueRow => ({ kind: 'lesson', item })),
  ];
  const hasRows = rows.length > 0;

  return (
    <ScreenContainer
      edges={isRootCatalogue ? ['top'] : []}
      style={styles.container}
    >
      <FlatList
        data={rows}
        keyExtractor={(row) =>
          row.kind === 'topic'
            ? `topic:${row.topic.slug}`
            : `lesson:${row.item.lesson.slug}`
        }
        contentContainerStyle={[
          styles.content,
          !isRootCatalogue && styles.nestedContent,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleVisibleRows}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={(hasRows || footer) && styles.header}
        ListFooterComponent={footer}
        ListFooterComponentStyle={hasRows && styles.footer}
        ItemSeparatorComponent={CatalogueSeparator}
        renderItem={({ item: row }) => {
          if (row.kind === 'topic') {
            const { topic } = row;
            return (
              <TopicCard
                topic={topic}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/(learning)/topics/[topic]',
                    params: { topic: topic.slug },
                  })
                }
              />
            );
          }

          const { item } = row;
          return (
            <LessonCard
              lesson={item.lesson}
              parentTitle={item.parent.title}
              showParentTitle={showParentTitle}
              saved={item.saved}
              completed={item.completed}
              bookmarkDisabled={bookmarkDisabled}
              onPress={() => {
                const { coverImageUrl, slug } = item.lesson;
                if (coverImageUrl !== null) void prefetchCover(coverImageUrl);
                router.push({
                  pathname: '/(tabs)/(learning)/lessons/[slug]',
                  params: { slug },
                });
              }}
              onToggleSaved={() => onToggleBookmark(item)}
            />
          );
        }}
      />
    </ScreenContainer>
  );
}
