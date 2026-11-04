import { api } from '@/features/auth';

import type { UserRecentArticle } from '@/api/generated/transport';

export async function readRecentArticles(): Promise<UserRecentArticle[]> {
  const response = await api.get<UserRecentArticle[]>(
    `/api/users/me/articles/recent`,
  );

  return response.data;
}
