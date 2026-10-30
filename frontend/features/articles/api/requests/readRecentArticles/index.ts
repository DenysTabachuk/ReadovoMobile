import { api } from '@/features/auth';

import type { RecentArticle } from '../../../recentArticles/types';

export async function readRecentArticles(): Promise<RecentArticle[]> {
  const response = await api.get<RecentArticle[]>(
    `/api/users/me/articles/recent`,
  );

  return response.data;
}
