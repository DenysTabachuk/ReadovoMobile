import { api } from '@/features/auth';
import type { RetakeQuizResponse } from '@/api/generated/transport';

export async function retakeQuiz(sessionId: string): Promise<string> {
  const response = await api.post<RetakeQuizResponse>(
    `/quiz-sessions/${sessionId}/retake`,
  );
  return response.data.sessionId;
}
