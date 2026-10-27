import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { RecentArticle } from '../../../recentArticles/types';

export async function readRecentArticles(
  userId: string,
): Promise<RecentArticle[]> {
  const response = await api
    .get<RecentArticle[]>(`/api/users/${userId}/articles/recent`)
    .catch(mapHttpError('articles.recent.loadFailed'));

  return response.data;
}
