import { api } from '@/features/auth';
import type {
  CompleteQuizRequest,
  QuizCompletionResponse,
} from '@/api/generated/transport';

export async function completeQuiz(
  sessionId: string,
): Promise<QuizCompletionResponse> {
  const payload: CompleteQuizRequest = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const response = await api.post<QuizCompletionResponse>(
    `/quiz-sessions/${sessionId}/complete`,
    payload,
  );
  return response.data;
}
