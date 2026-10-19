import { useQuery } from '@tanstack/react-query';
import { RECENT_ARTICLES_QUERY_KEY } from '../../../recentArticles/constants';
import { readRecentArticles } from '../../requests';

export function useRecentArticlesQuery(userId?: string | null) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: [...RECENT_ARTICLES_QUERY_KEY, userId],
    queryFn: () => readRecentArticles(userId ?? ''),
  });
}
