import { API_BASE_URL } from '@/api';

import type { WikipediaArticleDetail } from '../types';

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
    throw new Error('article.errorDescription');
  }

  return response.json() as Promise<WikipediaArticleDetail>;
}
