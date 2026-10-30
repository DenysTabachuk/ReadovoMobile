import type {
  SimplifyArticleLevel,
  SimplifyArticleTargetLength,
} from '../api/types';

export type ArticleQuizMode = 'article' | 'vocabulary';
type ArticleQuizSessionKeyParams = {
  articleId: number | null;
  mode: ArticleQuizMode;
  level: SimplifyArticleLevel;
  targetLength: SimplifyArticleTargetLength;
  userId?: string;
};

/**
 * Builds an account-owned key for a saved server quiz and its generation settings.
 * @param params - Local owner, article, quiz mode, difficulty and requested length.
 * @returns A stable readonly tuple; no account shares another account's quiz session.
 * @example
 * getArticleQuizSessionKey({ userId: 'reader-a', articleId: 42, mode: 'article', level: 'A2', targetLength: 'short' });
 * // => ['articleQuizSession', 'reader-a', 42, 'article', 'A2', 'short']
 */
export function getArticleQuizSessionKey({
  userId,
  articleId,
  mode,
  level,
  targetLength,
}: ArticleQuizSessionKeyParams) {
  return [
    'articleQuizSession',
    userId,
    articleId,
    mode,
    level,
    targetLength,
  ] as const;
}
