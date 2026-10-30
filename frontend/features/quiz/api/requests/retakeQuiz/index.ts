import { api } from '@/features/auth';

export async function retakeQuiz(sessionId: string): Promise<string> {
  const response = await api.post<{ sessionId: string }>(
    `/quiz-sessions/${sessionId}/retake`,
  );
  return response.data.sessionId;
}
