import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';

export async function removeSavedArticle(
  userId: string,
  articleId: number,
): Promise<SavedArticle[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/${userId}/articles/saved/${articleId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error('article.savedArticles.error');
  }

  return response.json() as Promise<SavedArticle[]>;
}
