import { API_BASE_URL } from '@/api';

import type { ArticleAdaptationsByArticleId } from '../../types';

export async function fetchArticleAdaptations(
  articleIds: number[],
  transformationType?: 'adaptation' | 'summary' | 'all',
): Promise<ArticleAdaptationsByArticleId> {
  if (articleIds.length === 0) {
    return {};
  }

  const searchParams = new URLSearchParams({
    articleIds: Array.from(new Set(articleIds)).join(','),
  });

  if (transformationType) {
    searchParams.set('transformationType', transformationType);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/articles/adaptations?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error('articles.errorDescription');
  }

  return response.json() as Promise<ArticleAdaptationsByArticleId>;
}
