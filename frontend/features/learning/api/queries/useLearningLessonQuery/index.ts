import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/features/auth';
import { usePreferences } from '@/providers/preferencesProvider';
import type { VocabularyLevel } from '@/api/generated/transport';
import { getLearningLesson } from '../../requests/getLearningLesson';

export function useLearningLessonQuery(slug: string, level: VocabularyLevel) {
  const { id } = useAuthenticatedUser();
  const { languagePreference } = usePreferences();
  return useQuery({
    queryKey: ['learning', id, languagePreference, 'lesson', slug, level],
    queryFn: () =>
      getLearningLesson({ slug, level, locale: languagePreference }),
  });
}
