import type { SavedArticle } from '../../types';
import type { WikipediaArticle } from '../../../api/wikipedia/types';

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
