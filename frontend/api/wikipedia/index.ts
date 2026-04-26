import { API_BASE_URL } from '@/api/auth/constants';

import { DEFAULT_ARTICLE_LIMIT } from './constants';
import { type WikipediaArticle, type WikipediaArticleDetail } from './types';

export type { WikipediaArticle, WikipediaArticleDetail } from './types';

export async function fetchRandomWikipediaArticles(
  limit = DEFAULT_ARTICLE_LIMIT
): Promise<WikipediaArticle[]> {
  const params = new URLSearchParams({
    limit: String(limit),
  });
  const response = await fetch(`${API_BASE_URL}/articles/random?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch Wikipedia articles.');
  }

  return response.json() as Promise<WikipediaArticle[]>;
}

export async function fetchWikipediaArticleDetail(
  pageId: number
): Promise<WikipediaArticleDetail> {
  const response = await fetch(`${API_BASE_URL}/articles/${pageId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch Wikipedia article.');
  }

  return response.json() as Promise<WikipediaArticleDetail>;
}
