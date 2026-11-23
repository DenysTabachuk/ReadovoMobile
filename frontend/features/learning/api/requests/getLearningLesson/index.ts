import { api } from '@/features/auth';
import type {
  GetLearningLessonResponse,
  VocabularyLevel,
} from '@/api/generated/transport';
import { isGetLearningLessonResponse } from '@/api/generated/learning-validators';

type LessonRequest = { slug: string; level: VocabularyLevel; locale: string };

export async function getLearningLesson({
  slug,
  level,
  locale,
}: LessonRequest): Promise<GetLearningLessonResponse> {
  const { data } = await api.get<unknown>(
    `/learning/lessons/${encodeURIComponent(slug)}`,
    { params: { level, locale } },
  );
  if (!isGetLearningLessonResponse(data))
    throw new Error('Invalid learning lesson response.');
  return data;
}
