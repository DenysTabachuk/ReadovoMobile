import { API_BASE_URL } from '@/api';

import type {
  GenerateArticleQuizRequest,
  GenerateArticleVocabularyQuizRequest,
  ArticleQuizSessionResponse,
} from '../../types';

const ARTICLE_QUIZ_GENERATION_TIMEOUT_MS = 60000;

/**
 * POST a quiz-generation request with a timeout shared by both quiz modes.
 *
 * Performs a network request. Aborts the fetch after 60 seconds; the timer ends when fetch
 * settles, before JSON parsing.
 *
 * @param path - API path, including its leading slash.
 * @param request - Article or vocabulary quiz settings to serialize as JSON.
 * @returns The parsed quiz session. Rejects with article.quiz.error on fetch failure or a
 *   non-OK response; JSON errors propagate.
 * @example
 * await generateArticleQuizRequest('/api/articles/quiz', {
 *   title: 'Space', text: 'The Moon orbits Earth.', level: 'A2', targetLength: 'short',
 * });
 * // => the quiz session returned by the server
 */
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
