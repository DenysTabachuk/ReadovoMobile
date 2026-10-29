import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

const ERROR_MESSAGES = new Map([
  [
    'ARTICLES_WIKIPEDIA_ARTICLE_UNAVAILABLE',
    { status: 502, messageKey: 'article.unavailable' },
  ],
  [
    'ARTICLES_WIKIPEDIA_CONTENT_UNAVAILABLE',
    { status: 502, messageKey: 'article.contentUnavailable' },
  ],
  [
    'ARTICLES_ADAPTATION_UNAVAILABLE',
    { status: 502, messageKey: 'article.adaptError' },
  ],
  [
    'ARTICLES_SUMMARY_UNAVAILABLE',
    { status: 502, messageKey: 'article.summaryError' },
  ],
  [
    'ARTICLES_QUIZ_GENERATION_FAILED',
    { status: 502, messageKey: 'article.quiz.error' },
  ],
  [
    'ARTICLES_VOCABULARY_QUIZ_GENERATION_FAILED',
    { status: 502, messageKey: 'article.quiz.error' },
  ],
]);

/**
 * Selects article feedback from known API codes, never backend message text.
 * @param error - Request failure; cancellation remains silent.
 * @param fallbackKey - Optional override; unknown failures default to errors.generic.
 * @returns A translation key or null. Unknown codes/statuses use the fallback.
 * @example
 * getArticleErrorMessageKey(new Error('private'));
 * // => 'errors.generic'
 */
export function getArticleErrorMessageKey(
  error: unknown,
  fallbackKey?: string,
): string | null {
  return getApiErrorMessageKey(error, { fallbackKey, codes: ERROR_MESSAGES });
}
