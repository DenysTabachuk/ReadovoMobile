import { useAuth } from '@/features/auth';
import { useQuery } from '@tanstack/react-query';
import { RECENT_ARTICLES_QUERY_KEY } from '../../../recentArticles/constants';
import { readRecentArticles } from '../../requests';

export function useRecentArticlesQuery() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  return useQuery({
    enabled: Boolean(userId),
    queryKey: [...RECENT_ARTICLES_QUERY_KEY, userId],
    queryFn: () => readRecentArticles(),
  });
}
