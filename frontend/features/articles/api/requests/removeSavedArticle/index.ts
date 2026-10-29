import { api } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';

export async function removeSavedArticle(
  userId: string,
  articleId: number,
): Promise<SavedArticle[]> {
  const response = await api.delete<SavedArticle[]>(
    `/api/users/${userId}/articles/saved/${articleId}`,
  );

  return response.data;
}
