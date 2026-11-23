import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { FlatList, View } from 'react-native';
import type { LearningEntry } from '@/api/generated/transport';
import { ScreenContainer } from '@/components/screenContainer';
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
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/(learning)/lessons/[slug]',
                  params: { slug: item.lesson.slug },
                })
              }
              onToggleSaved={() => onToggleBookmark(item)}
            />
          );
        }}
      />
    </ScreenContainer>
  );
}
