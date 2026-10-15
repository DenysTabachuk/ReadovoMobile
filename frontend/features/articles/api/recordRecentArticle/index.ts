import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { RecentArticle } from '../../recentArticles/types';
import type { WikipediaArticle } from '../wikipedia/types';

export async function recordRecentArticle(
  userId: string,
  article: WikipediaArticle,
): Promise<RecentArticle[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/${userId}/articles/recent`,
    {
      body: JSON.stringify(article),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('articles.recent.saveFailed');
  }

  return response.json() as Promise<RecentArticle[]>;
}
