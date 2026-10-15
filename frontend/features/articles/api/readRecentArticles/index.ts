import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { RecentArticle } from '../../recentArticles/types';

export async function readRecentArticles(
  userId: string,
): Promise<RecentArticle[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/${userId}/articles/recent`,
  );

  if (!response.ok) {
    throw new Error('articles.recent.loadFailed');
  }

  return response.json() as Promise<RecentArticle[]>;
}
