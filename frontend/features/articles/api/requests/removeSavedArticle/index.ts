import { api } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';

export async function removeSavedArticle(
  articleId: number,
): Promise<SavedArticle[]> {
  const response = await api.delete<SavedArticle[]>(
    `/api/users/me/articles/saved/${articleId}`,
  );

  return response.data;
}
