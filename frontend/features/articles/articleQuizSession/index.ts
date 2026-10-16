import {
  type SimplifyArticleLevel,
  type SimplifyArticleTargetLength,
} from '@/features/articles/api/wikipedia';

export type ArticleQuizMode = 'article' | 'vocabulary';

/**
 * Build a query key that separates quiz sessions by article and generation settings.
 *
 * @param articleId - Source article ID, or null before it is resolved.
 * @param mode - Article-knowledge or vocabulary quiz mode.
 * @param level - Requested language level.
 * @param targetLength - Concrete target article length.
 * @returns A readonly query-key tuple including every setting that identifies the session.
 * @example
 * getArticleQuizSessionKey(42, 'vocabulary', 'A2', 'short');
 * // => ['articleQuizSession', 42, 'vocabulary', 'A2', 'short']
 */
export function getArticleQuizSessionKey(
  articleId: number | null,
  mode: ArticleQuizMode,
  level: SimplifyArticleLevel,
  targetLength: SimplifyArticleTargetLength,
) {
  return ['articleQuizSession', articleId, mode, level, targetLength] as const;
}
