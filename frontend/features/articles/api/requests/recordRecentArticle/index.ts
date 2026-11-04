import { api } from '@/features/auth';

import type {
  UserRecentArticle,
  SaveArticleRequest,
} from '@/api/generated/transport';

export async function recordRecentArticle(
  article: SaveArticleRequest,
): Promise<UserRecentArticle[]> {
  const response = await api.post<UserRecentArticle[]>(
    `/api/users/me/articles/recent`,
    article,
  );

  return response.data;
}
