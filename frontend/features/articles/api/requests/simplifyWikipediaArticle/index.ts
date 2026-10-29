import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import type {
  SimplifyArticleRequest,
  SimplifyArticleResponse,
} from '../../types';

export async function simplifyWikipediaArticle(
  request: SimplifyArticleRequest,
): Promise<SimplifyArticleResponse> {
  const response = await httpClient(`${API_BASE_URL}/api/articles/simplify`, {
    data: request,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  return response.data as SimplifyArticleResponse;
}
