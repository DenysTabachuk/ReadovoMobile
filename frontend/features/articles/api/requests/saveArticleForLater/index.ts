import { api } from '@/features/auth';

import type {
  UserSavedArticle,
  SaveArticleRequest,
} from '@/api/generated/transport';

export async function saveArticleForLater(
  article: SaveArticleRequest,
): Promise<UserSavedArticle[]> {
  const response = await api.post<UserSavedArticle[]>(
    `/api/users/me/articles/saved`,
    article,
  );

  return response.data;
}
