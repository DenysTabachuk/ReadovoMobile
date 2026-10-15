import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { SavedArticle } from '../../savedArticles/types';

export async function readSavedArticles(
  userId: string,
): Promise<SavedArticle[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/${userId}/articles/saved`,
  );

  if (!response.ok) {
    throw new Error('article.savedArticles.loadFailed');
  }

  return response.json() as Promise<SavedArticle[]>;
}
