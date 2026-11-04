import type {
  GenerateArticleVocabularyQuizRequest,
  GenerateArticleVocabularyQuizResponse,
} from '@/api/generated/transport';
import { generateArticleQuizRequest } from '../../utils/generateArticleQuizRequest';

export async function generateArticleVocabularyQuiz(
  request: GenerateArticleVocabularyQuizRequest,
): Promise<GenerateArticleVocabularyQuizResponse> {
  return generateArticleQuizRequest('/api/articles/vocabulary-quiz', request);
}
