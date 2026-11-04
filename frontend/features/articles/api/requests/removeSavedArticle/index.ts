import { api } from '@/features/auth';

import type { UserSavedArticle } from '@/api/generated/transport';

export async function removeSavedArticle(
  articleId: number,
): Promise<UserSavedArticle[]> {
  const response = await api.delete<UserSavedArticle[]>(
    `/api/users/me/articles/saved/${articleId}`,
  );

  return response.data;
}
