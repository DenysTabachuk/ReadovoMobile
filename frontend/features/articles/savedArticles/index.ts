import { API_BASE_URL } from '@/api/auth/constants';
import { type WikipediaArticle, type WikipediaArticleDetail } from '@/api/wikipedia';

export const SAVED_ARTICLES_QUERY_KEY = ['savedArticles'] as const;

export type SavedArticle = WikipediaArticle & {
  savedAt: string;
};

export function createSavedArticleFromDetail(
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

export function isArticleSaved(
  articleId: number | null,
  savedArticles: SavedArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(savedArticles?.some((article) => article.id === articleId));
}

export async function readSavedArticles(userId: string): Promise<SavedArticle[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/articles/saved`,
  );

  if (!response.ok) {
    throw new Error('article.savedArticles.loadFailed');
  }

  return response.json() as Promise<SavedArticle[]>;
}

export async function saveArticleForLater(
  userId: string,
  article: WikipediaArticle,
): Promise<SavedArticle[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/articles/saved`,
    {
      body: JSON.stringify(article),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('article.savedArticles.error');
  }

  return response.json() as Promise<SavedArticle[]>;
}

export async function removeSavedArticle(
  userId: string,
  articleId: number,
): Promise<SavedArticle[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/articles/saved/${articleId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error('article.savedArticles.error');
  }

  return response.json() as Promise<SavedArticle[]>;
}

export function createSavedArticlesWithArticle(
  savedArticles: SavedArticle[] | undefined,
  article: WikipediaArticle,
): SavedArticle[] {
  return [
    {
      ...article,
      savedAt: new Date().toISOString(),
    },
    ...(savedArticles ?? []).filter((savedArticle) => savedArticle.id !== article.id),
  ];
}

function createArticleExtract(content: string): string {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (compactContent.length <= 180) {
    return compactContent;
  }

  return `${compactContent.slice(0, 177).trim()}...`;
}
