import type { SavedArticle } from '../../types';
import type { WikipediaArticle } from '../../../api/wikipedia/types';

/**
 * Put an article first in the saved list for an optimistic UI update.
 *
 * Uses the current time. Existing input objects and the original array are not mutated.
 *
 * @param savedArticles - Current saved list, or undefined before loading.
 * @param article - Article preview to insert or replace.
 * @returns A new list with a fresh ISO savedAt timestamp and all older entries for this ID
 *   removed.
 * @example
 * const article = { id: 42, title: 'Space', extract: '', url: 'https://example.com/42' };
 * const saved = createSavedArticlesWithArticle(undefined, article);
 * [saved.length, saved[0].id];
 * // => [1, 42]
 */
export function createSavedArticlesWithArticle(
  savedArticles: SavedArticle[] | undefined,
  article: WikipediaArticle,
): SavedArticle[] {
  return [
    {
      ...article,
      savedAt: new Date().toISOString(),
    },
    ...(savedArticles ?? []).filter(
      (savedArticle) => savedArticle.id !== article.id,
    ),
  ];
}
