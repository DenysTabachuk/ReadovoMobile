import { api } from '@/features/auth';
import type { QuizCompletionResponse } from '../../types';

export async function completeQuiz(
  sessionId: string,
): Promise<QuizCompletionResponse> {
  const response = await api.post<QuizCompletionResponse>(
    `/quiz-sessions/${sessionId}/complete`,
    { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  );
  return response.data;
}
