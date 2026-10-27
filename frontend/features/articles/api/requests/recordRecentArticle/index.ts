import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { RecentArticle } from '../../../recentArticles/types';
import type { WikipediaArticle } from '../../types';

export async function recordRecentArticle(
  userId: string,
  article: WikipediaArticle,
): Promise<RecentArticle[]> {
  const response = await api
    .post<RecentArticle[]>(`/api/users/${userId}/articles/recent`, article)
    .catch(mapHttpError('articles.recent.saveFailed'));

  return response.data;
}
