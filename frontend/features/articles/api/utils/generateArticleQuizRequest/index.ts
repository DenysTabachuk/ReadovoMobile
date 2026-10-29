import { type AxiosResponse } from 'axios';
import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import type {
  ArticleQuizSessionResponse,
  GenerateArticleQuizRequest,
  GenerateArticleVocabularyQuizRequest,
} from '../../types';

const ARTICLE_QUIZ_GENERATION_TIMEOUT_MS = 60000;

/**
 * POST a quiz-generation request with a timeout shared by both quiz modes.
 *
 * Aborts the HTTP operation after 60 seconds, including response body transfer.
 * Axios parses the body before resolving; the timer is always cleaned up.
 *
 * @param path - API path, including its leading slash.
 * @param request - Article or vocabulary quiz settings to serialize as JSON.
 * @returns The parsed quiz session. HTTP codes, JSON failures and transport errors
 * propagate unchanged. The owned 60-second abort becomes a TimeoutError.
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

  let response: AxiosResponse<unknown>;

  try {
    response = await httpClient(`${API_BASE_URL}${path}`, {
      data: request,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      const timeout = new Error('Article quiz request timed out.');
      timeout.name = 'TimeoutError';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  return response.data as TResponse;
}
