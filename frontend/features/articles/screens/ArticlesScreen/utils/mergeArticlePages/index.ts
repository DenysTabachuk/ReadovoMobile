import type { WikipediaArticle } from '@/features/articles/api';

/**
 * Flatten article pages while removing duplicate IDs in first-seen order.
 *
 * @param pages - Loaded result pages, or undefined before the first response.
 * @returns Unique article references; later duplicates replace data without moving its position. Inputs are unchanged.
 * @example
 * mergeArticlePages(undefined);
 * // => []
 */
export function mergeArticlePages(
  pages?: WikipediaArticle[][],
): WikipediaArticle[] {
  const articleById = new Map<number, WikipediaArticle>();
  for (const article of pages?.flat() ?? [])
    articleById.set(article.id, article);
  return Array.from(articleById.values());
}
