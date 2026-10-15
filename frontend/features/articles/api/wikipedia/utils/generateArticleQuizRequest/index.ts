import { API_BASE_URL } from '@/api';

import type {
  GenerateArticleQuizRequest,
  GenerateArticleVocabularyQuizRequest,
  ArticleQuizSessionResponse,
} from '../../types';

const ARTICLE_QUIZ_GENERATION_TIMEOUT_MS = 60000;

export async function generateArticleQuizRequest<
  TRequest extends
    GenerateArticleQuizRequest | GenerateArticleVocabularyQuizRequest,
  TResponse extends ArticleQuizSessionResponse,
>(path: string, request: TRequest): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    ARTICLE_QUIZ_GENERATION_TIMEOUT_MS,
  );

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });
  } catch {
    throw new Error('article.quiz.error');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error('article.quiz.error');
  }

  return response.json() as Promise<TResponse>;
}
