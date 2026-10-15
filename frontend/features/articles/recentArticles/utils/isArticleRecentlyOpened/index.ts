import type { RecentArticle } from '../../types';

export function isArticleRecentlyOpened(
  articleId: number | null,
  recentArticles: RecentArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(recentArticles?.some((article) => article.id === articleId));
}
