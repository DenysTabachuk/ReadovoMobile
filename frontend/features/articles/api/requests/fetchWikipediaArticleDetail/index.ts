import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import type {
  WikipediaArticleDetail,
  ArticleDetailQuery,
} from '@/api/generated/transport';

export async function fetchWikipediaArticleDetail(
  pageId: number,
  languageCode: ArticleDetailQuery['languageCode'] = 'en',
): Promise<WikipediaArticleDetail> {
  const params = new URLSearchParams({
    languageCode,
  });
  const response = await httpClient<WikipediaArticleDetail>(
    `${API_BASE_URL}/articles/${pageId}?${params.toString()}`,
  );

  return response.data;
}
