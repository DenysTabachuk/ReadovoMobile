import type { SavedArticle } from '../../types';

/**
 * Check whether an article is already saved for later.
 *
 * @param articleId - Article ID, or null when no article is selected.
 * @param savedArticles - Loaded saved articles, or undefined before loading.
 * @returns True for a matching ID; false for a missing ID or list.
 * @example
 * isArticleSaved(null, undefined);
 * // => false
 */
export function isArticleSaved(
  articleId: number | null,
  savedArticles: SavedArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(savedArticles?.some((article) => article.id === articleId));
}
