import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import type {
  ArticleAdaptationsByArticleId,
  ArticleAdaptationsQuery,
} from '@/api/generated/transport';

export async function fetchArticleAdaptations(
  articleIds: ArticleAdaptationsQuery['articleIds'],
  transformationType?: ArticleAdaptationsQuery['transformationType'],
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

  const response = await httpClient<ArticleAdaptationsByArticleId>(
    `${API_BASE_URL}/api/articles/adaptations?${searchParams.toString()}`,
  );

  return response.data;
}
