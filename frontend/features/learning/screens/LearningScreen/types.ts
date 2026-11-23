import type {
  LearningEntry,
  LearningLessonSummary,
} from '@/api/generated/transport';

export type CatalogueTab = 'all' | 'saved' | 'completed';

export type CatalogueLesson = {
  lesson: LearningLessonSummary;
  parent: LearningEntry;
  saved: boolean;
  completed: boolean;
};
