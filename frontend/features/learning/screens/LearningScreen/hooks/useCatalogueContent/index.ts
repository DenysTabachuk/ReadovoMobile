import { useTranslation } from 'react-i18next';
import type {
  LearningEntry,
  LearningLessonSummary,
} from '@/api/generated/transport';
import { useBanner } from '@/components/banner';
import { useLearningCatalogueQuery } from '../../../../api/queries/useLearningCatalogueQuery';
import { useLessonParentCatalogues } from '../../../../api/queries/useLessonParentCatalogues';
import { useLessonLibrary } from '../../../../hooks/useLessonLibrary';
import type { CatalogueLesson, CatalogueTab } from '../../types';

type CatalogueContentOptions = {
  topic?: string;
  tab: CatalogueTab;
  search: string;
};

/**
 * Resolves the visible catalogue entries and the state of their lesson bookmarks.
 *
 * @param options - Omit the topic for the root catalogue. The selected tab
 * determines which entries are searched and which parent catalogues are loaded.
 * @returns The catalogue query, matching entries, and library state and actions.
 * Failed bookmark writes show an error banner while the screen is mounted.
 * @example
 * const content = useCatalogueContent({ tab: 'saved', search: 'Munich' });
 * // Lists saved lessons matching the search as their parent catalogues load.
 */
export function useCatalogueContent({
  topic,
  tab,
  search,
}: CatalogueContentOptions) {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const catalogue = useLearningCatalogueQuery(topic);
  const { query: library, mutation: bookmark } = useLessonLibrary();
  const libraryEntries = library.data ?? [];
  const selectedEntries =
    tab === 'all' ? [] : libraryEntries.filter((entry) => entry[tab]);
  const parentTopics = [
    ...new Set(selectedEntries.map((entry) => entry.topic)),
  ];
  const parentCatalogues = useLessonParentCatalogues(parentTopics);

  const term = search.trim().toLocaleLowerCase();
  const matchesSearch = (entry: LearningEntry) =>
    entry.title.toLocaleLowerCase().includes(term) ||
    entry.description.toLocaleLowerCase().includes(term);
  const topics =
    tab === 'all' ? (catalogue.data?.topics.filter(matchesSearch) ?? []) : [];
  const lessons: CatalogueLesson[] = [];
  const addLesson = (lesson: LearningLessonSummary, parent: LearningEntry) => {
    const state = libraryEntries.find((entry) => entry.slug === lesson.slug);
    lessons.push({
      lesson,
      parent,
      saved: state?.saved ?? false,
      completed: state?.completed ?? false,
    });
  };

  if (tab === 'all') {
    const data = catalogue.data;
    if (data?.topic) {
      for (const lesson of data.lessons.filter(matchesSearch)) {
        addLesson(lesson, data.topic);
      }
    }
  } else {
    const catalogueByTopic = new Map(
      parentCatalogues.flatMap(({ data }) =>
        data?.topic ? [[data.topic.slug, data] as const] : [],
      ),
    );
    for (const entry of selectedEntries) {
      const parentCatalogue = catalogueByTopic.get(entry.topic);
      const parent = parentCatalogue?.topic;
      const lesson = parentCatalogue?.lessons.find(
        ({ slug }) => slug === entry.slug,
      );
      if (
        parent &&
        lesson &&
        (matchesSearch(lesson) ||
          parent.title.toLocaleLowerCase().includes(term))
      ) {
        addLesson(lesson, parent);
      }
    }
  }

  const loadingLibrary =
    tab !== 'all' &&
    (library.isPending || parentCatalogues.some((query) => query.isPending));
  const libraryError =
    library.isError || parentCatalogues.some((query) => query.isError);

  function retryLibrary() {
    if (library.isError) void library.refetch();
    for (const query of parentCatalogues) {
      if (query.isError) void query.refetch();
    }
  }

  function toggleBookmark({ lesson, parent, saved }: CatalogueLesson) {
    bookmark.mutate(
      {
        slug: lesson.slug,
        topic: parent.slug,
        flag: 'saved',
        value: !saved,
      },
      {
        onError: () =>
          showBanner({
            title: t('learning.topics.libraryWriteError'),
            variant: 'error',
          }),
      },
    );
  }

  return {
    catalogue,
    topics,
    lessons,
    hasSearch: term.length > 0,
    loadingLibrary,
    libraryError,
    retryLibrary,
    bookmarkDisabled: !library.data || bookmark.isPending,
    toggleBookmark,
  };
}
