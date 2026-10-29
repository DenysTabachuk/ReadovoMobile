import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import type { WikipediaArticleDetail } from '../../types';

export async function fetchWikipediaArticleDetail(
  pageId: number,
  languageCode = 'en',
): Promise<WikipediaArticleDetail> {
  const params = new URLSearchParams({
    languageCode,
  });
  const response = await httpClient(
    `${API_BASE_URL}/articles/${pageId}?${params.toString()}`,
  );

  return response.data as WikipediaArticleDetail;
}
