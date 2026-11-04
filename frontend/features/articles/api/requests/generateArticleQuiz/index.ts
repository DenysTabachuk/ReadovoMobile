import type {
  GenerateArticleQuizRequest,
  GenerateArticleQuizResponse,
} from '@/api/generated/transport';
import { generateArticleQuizRequest } from '../../utils/generateArticleQuizRequest';

export async function generateArticleQuiz(
  request: GenerateArticleQuizRequest,
): Promise<GenerateArticleQuizResponse> {
  return generateArticleQuizRequest('/api/articles/quiz', request);
}
