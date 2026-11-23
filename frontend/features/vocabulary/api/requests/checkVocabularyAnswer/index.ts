import { api } from '@/features/auth';
import type {
  CheckLearningAnswerRequest,
  VocabularyLevel,
} from '@/api/generated/transport';
import type { VocabularyAnswerSubmission } from '../../types';
import { isCheckVocabularyAnswerResponse } from '@/api/generated/learning-validators';

export async function checkVocabularyAnswer(
  slug: string,
  level: VocabularyLevel,
  submission: VocabularyAnswerSubmission,
) {
  const body: CheckLearningAnswerRequest = { optionId: submission.optionId };
  const response = await api.post<unknown>(
    `/learning/lessons/${encodeURIComponent(slug)}/vocabulary/exercises/${encodeURIComponent(submission.questionId)}/check`,
    body,
    { params: { level } },
  );
  if (!isCheckVocabularyAnswerResponse(response.data)) {
    throw new Error('Invalid vocabulary answer response.');
  }
  return response.data;
}
