import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import type {
  SimplifyArticleRequest,
  SimplifyArticleResponse,
} from '@/api/generated/transport';

export async function simplifyWikipediaArticle(
  request: SimplifyArticleRequest,
): Promise<SimplifyArticleResponse> {
  const response = await httpClient<SimplifyArticleResponse>(
    `${API_BASE_URL}/api/articles/simplify`,
    {
      data: request,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  return response.data;
}
