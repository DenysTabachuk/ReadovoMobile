import { useQuery } from '@tanstack/react-query';
import { SAVED_ARTICLES_QUERY_KEY } from '../../../savedArticles/constants';
import { readSavedArticles } from '../../requests';

export function useSavedArticlesQuery(userId?: string | null) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => readSavedArticles(userId ?? ''),
    queryKey: [...SAVED_ARTICLES_QUERY_KEY, userId],
  });
}
