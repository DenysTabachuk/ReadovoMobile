import { useAuth } from '@/features/auth';
import { useQuery } from '@tanstack/react-query';
import { SAVED_ARTICLES_QUERY_KEY } from '../../../savedArticles/constants';
import { readSavedArticles } from '../../requests';

export function useSavedArticlesQuery() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => readSavedArticles(),
    queryKey: [...SAVED_ARTICLES_QUERY_KEY, userId],
  });
}
