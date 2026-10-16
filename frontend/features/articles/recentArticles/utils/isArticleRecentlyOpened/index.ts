import type { RecentArticle } from '../../types';

/**
 * Check whether an article appears in the recent-reading list.
 *
 * @param articleId - Article ID, or null when no article is selected.
 * @param recentArticles - Loaded recent articles, or undefined before loading.
 * @returns True for a matching ID; false for a missing ID or list.
 * @example
 * isArticleRecentlyOpened(null, undefined);
 * // => false
 */
export function isArticleRecentlyOpened(
  articleId: number | null,
  recentArticles: RecentArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(recentArticles?.some((article) => article.id === articleId));
}
