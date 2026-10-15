import type {
  GenerateArticleQuizRequest,
  GenerateArticleQuizResponse,
} from '../types';
import { generateArticleQuizRequest } from '../utils/generateArticleQuizRequest';

export async function generateArticleQuiz(
  request: GenerateArticleQuizRequest,
): Promise<GenerateArticleQuizResponse> {
  return generateArticleQuizRequest('/api/articles/quiz', request);
}
