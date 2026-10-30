import { api } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';

export async function readSavedArticles(): Promise<SavedArticle[]> {
  const response = await api.get<SavedArticle[]>(
    `/api/users/me/articles/saved`,
  );

  return response.data;
}
