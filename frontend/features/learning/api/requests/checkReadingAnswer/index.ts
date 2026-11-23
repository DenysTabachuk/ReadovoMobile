import { api } from '@/features/auth';
import type {
  CheckLearningAnswerRequest,
  CheckReadingAnswerResponse,
  VocabularyLevel,
} from '@/api/generated/transport';
import { isCheckReadingAnswerResponse } from '@/api/generated/learning-validators';

type ReadingAnswerRequest = CheckLearningAnswerRequest & {
  slug: string;
  level: VocabularyLevel;
  questionId: string;
};

/**
 * Checks a reading-comprehension choice against the selected lesson level.
 *
 * @param input - Lesson slug, level, question ID, and selected option ID.
 * @returns Validated feedback with the correct choice and explanation.
 * @example
 * const feedback = await checkReadingAnswer({
 *   slug: 'oktoberfest', level: 'B2', questionId: 'rain', optionId: 'rainy',
 * });
 * // feedback.isCorrect reflects whether the selected choice is correct.
 */
export async function checkReadingAnswer({
  slug,
  level,
  questionId,
  optionId,
}: ReadingAnswerRequest): Promise<CheckReadingAnswerResponse> {
  const { data } = await api.post<unknown>(
    `/learning/lessons/${encodeURIComponent(slug)}/questions/${encodeURIComponent(questionId)}/check`,
    { optionId },
    { params: { level } },
  );
  if (!isCheckReadingAnswerResponse(data))
    throw new Error('Invalid reading answer response.');
  return data;
}
