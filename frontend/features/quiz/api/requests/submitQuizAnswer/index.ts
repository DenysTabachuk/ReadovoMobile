import { api } from '@/features/auth';
import type {
  QuizSessionParams,
  SubmitQuizAnswerRequest,
  SubmitQuizAnswerResponse,
} from '@/api/generated/transport';

type SubmitQuizAnswerParams = QuizSessionParams & SubmitQuizAnswerRequest;

export async function submitQuizAnswer({
  sessionId,
  questionId,
  selectedOptionIds,
}: SubmitQuizAnswerParams): Promise<SubmitQuizAnswerResponse> {
  const response = await api.post<SubmitQuizAnswerResponse>(
    `/quiz-sessions/${sessionId}/answers`,
    { questionId, selectedOptionIds },
  );
  return response.data;
}
