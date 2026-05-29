import { authenticatedFetch } from '@/api/auth/authenticatedFetch';
import { API_BASE_URL } from '@/api/auth/constants';
import { type WikipediaArticle, type WikipediaArticleDetail } from '@/api/wikipedia';

export const RECENT_ARTICLES_QUERY_KEY = ['recentArticles'] as const;

export type RecentArticle = WikipediaArticle & {
  openedAt: string;
};

export function createRecentArticleFromDetail(
  article: WikipediaArticleDetail,
): WikipediaArticle {
  return {
    extract: createArticleExtract(article.content),
    id: article.id,
    thumbnailUrl: article.thumbnailUrl,
    title: article.title,
    url: article.url,
  };
}

export function isArticleRecentlyOpened(
  articleId: number | null,
  recentArticles: RecentArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(recentArticles?.some((article) => article.id === articleId));
}

export async function readRecentArticles(userId: string): Promise<RecentArticle[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/${userId}/articles/recent`,
  );

  if (!response.ok) {
    throw new Error('articles.recent.loadFailed');
  }

  return response.json() as Promise<RecentArticle[]>;
}

export async function recordRecentArticle(
  userId: string,
  article: WikipediaArticle,
): Promise<RecentArticle[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/${userId}/articles/recent`,
    {
      body: JSON.stringify(article),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('articles.recent.saveFailed');
  }

  return response.json() as Promise<RecentArticle[]>;
}

function createArticleExtract(content: string): string {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (compactContent.length <= 180) {
    return compactContent;
  }

  return `${compactContent.slice(0, 177).trim()}...`;
}
