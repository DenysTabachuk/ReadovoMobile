import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';

export async function removeSavedArticle(
  userId: string,
  articleId: number,
): Promise<SavedArticle[]> {
  const response = await api
    .delete<SavedArticle[]>(`/api/users/${userId}/articles/saved/${articleId}`)
    .catch(mapHttpError('article.savedArticles.error'));

  return response.data;
}
