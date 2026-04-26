import { API_BASE_URL } from '@/api/auth/constants';

import { DEFAULT_ARTICLE_LIMIT } from './constants';
import {
  type FetchWikipediaArticlesParams,
  type SimplifyArticleRequest,
  type SimplifyArticleResponse,
  type WikipediaArticle,
  type WikipediaArticleDetail,
} from './types';

export type {
  FetchWikipediaArticlesParams,
  SimplifyArticleLevel,
  SimplifyArticleRequest,
  SimplifyArticleResponse,
  SimplifyArticleTargetLength,
  WikipediaArticle,
  WikipediaArticleCategory,
  WikipediaArticleDetail,
} from './types';

export async function fetchWikipediaArticles(
  params: FetchWikipediaArticlesParams = {},
): Promise<WikipediaArticle[]> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit ?? DEFAULT_ARTICLE_LIMIT),
  });

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }

  const response = await fetch(`${API_BASE_URL}/articles?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch Wikipedia articles.');
  }

  return response.json() as Promise<WikipediaArticle[]>;
}

export async function fetchRandomWikipediaArticles(
  limit = DEFAULT_ARTICLE_LIMIT
): Promise<WikipediaArticle[]> {
  return fetchWikipediaArticles({ limit });
}

export async function fetchWikipediaArticleDetail(
  pageId: number,
  languageCode = 'en',
): Promise<WikipediaArticleDetail> {
  const params = new URLSearchParams({
    languageCode,
  });
  const response = await fetch(
    `${API_BASE_URL}/articles/${pageId}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Wikipedia article.');
  }

  return response.json() as Promise<WikipediaArticleDetail>;
}

export async function simplifyWikipediaArticle(
  request: SimplifyArticleRequest
): Promise<SimplifyArticleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/articles/simplify`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    let errorMessage = 'article.adaptError';

    try {
      const errorBody = (await response.json()) as {
        message?: string | string[];
      };
      const backendMessage = Array.isArray(errorBody.message)
        ? errorBody.message[0]
        : errorBody.message;

      if (backendMessage) {
        errorMessage = `${errorMessage}: ${backendMessage}`;
      }
    } catch {
      // Ignore malformed error bodies and fall back to the localized message key.
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<SimplifyArticleResponse>;
}
