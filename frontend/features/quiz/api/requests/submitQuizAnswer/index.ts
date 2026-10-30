import { api } from '@/features/auth';
import type { QuizSubmitResult } from '../../../types';
import type { SubmitQuizAnswerRequest } from '../../types';

export async function submitQuizAnswer({
  sessionId,
  questionId,
  selectedOptionIds,
}: SubmitQuizAnswerRequest): Promise<QuizSubmitResult> {
  const response = await api.post<QuizSubmitResult>(
    `/quiz-sessions/${sessionId}/answers`,
    { questionId, selectedOptionIds },
  );
  return response.data;
}
