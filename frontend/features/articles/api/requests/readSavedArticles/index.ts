import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';

export async function readSavedArticles(
  userId: string,
): Promise<SavedArticle[]> {
  const response = await api
    .get<SavedArticle[]>(`/api/users/${userId}/articles/saved`)
    .catch(mapHttpError('article.savedArticles.loadFailed'));

  return response.data;
}
