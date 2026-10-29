import { api } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';
import type { WikipediaArticle } from '../../types';

export async function saveArticleForLater(
  userId: string,
  article: WikipediaArticle,
): Promise<SavedArticle[]> {
  const response = await api.post<SavedArticle[]>(
    `/api/users/${userId}/articles/saved`,
    article,
  );

  return response.data;
}
