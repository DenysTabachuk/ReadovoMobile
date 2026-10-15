import { API_BASE_URL } from '@/api';

import type { SimplifyArticleRequest, SimplifyArticleResponse } from '../types';

export async function simplifyWikipediaArticle(
  request: SimplifyArticleRequest,
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
