import { mapHttpError } from '@/api/utils/mapHttpError';
import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import { DEFAULT_ARTICLE_LIMIT } from '../../constants';
import type {
  FetchWikipediaArticlesParams,
  WikipediaArticle,
} from '../../types';

export async function fetchWikipediaArticles(
  params: FetchWikipediaArticlesParams = {},
): Promise<WikipediaArticle[]> {
  // TODO: Extract query normalization into a colocated buildArticleSearchParams
  // utility. Preserve omitted UI defaults ('all'/'default'), trimmed search,
  // comma-separated excludeIds, and the explicit recommended=false value.
  const searchParams = new URLSearchParams({
    limit: String(params.limit ?? DEFAULT_ARTICLE_LIMIT),
  });

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }

  if (params.excludeIds?.length) {
    searchParams.set('excludeIds', params.excludeIds.join(','));
  }

  if (params.previewLength && params.previewLength !== 'all') {
    searchParams.set('previewLength', params.previewLength);
  }

  if (params.preferImagesFirst) {
    searchParams.set('preferImagesFirst', 'true');
  }

  if (params.sortBy && params.sortBy !== 'default') {
    searchParams.set('sortBy', params.sortBy);
  }

  if (params.readyLevel && params.readyLevel !== 'all') {
    searchParams.set('readyLevel', params.readyLevel);
  }

  if (
    params.readyTransformationType &&
    params.readyTransformationType !== 'all'
  ) {
    searchParams.set('readyTransformationType', params.readyTransformationType);
  }

  if (params.recommended !== undefined) {
    searchParams.set('recommended', String(params.recommended));
  }

  const response = await httpClient(
    `${API_BASE_URL}/articles?${searchParams.toString()}`,
  ).catch(mapHttpError('articles.errorDescription'));

  return response.data as WikipediaArticle[];
}
