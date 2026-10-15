import type { SavedArticle } from '../../types';

export function isArticleSaved(
  articleId: number | null,
  savedArticles: SavedArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(savedArticles?.some((article) => article.id === articleId));
}
