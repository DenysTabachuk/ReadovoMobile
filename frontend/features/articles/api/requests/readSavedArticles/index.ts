import { api } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';

export async function readSavedArticles(
  userId: string,
): Promise<SavedArticle[]> {
  const response = await api.get<SavedArticle[]>(
    `/api/users/${userId}/articles/saved`,
  );

  return response.data;
}
