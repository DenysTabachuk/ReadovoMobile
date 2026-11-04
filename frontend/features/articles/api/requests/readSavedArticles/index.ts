import { api } from '@/features/auth';

import type { UserSavedArticle } from '@/api/generated/transport';

export async function readSavedArticles(): Promise<UserSavedArticle[]> {
  const response = await api.get<UserSavedArticle[]>(
    `/api/users/me/articles/saved`,
  );

  return response.data;
}
