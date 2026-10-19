import type {
  GenerateArticleVocabularyQuizRequest,
  GenerateArticleVocabularyQuizResponse,
} from '../../types';
import { generateArticleQuizRequest } from '../../utils/generateArticleQuizRequest';

export async function generateArticleVocabularyQuiz(
  request: GenerateArticleVocabularyQuizRequest,
): Promise<GenerateArticleVocabularyQuizResponse> {
  return generateArticleQuizRequest('/api/articles/vocabulary-quiz', request);
}
