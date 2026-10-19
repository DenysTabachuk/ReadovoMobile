import { useQuery } from '@tanstack/react-query';
import { fetchArticleAdaptations } from '../../requests';

export function useArticleAdaptationsQuery(articleId: number | number[]) {
  const ids = Array.isArray(articleId) ? articleId : [articleId];
  return useQuery({
    enabled: ids.length > 0,
    queryFn: () => fetchArticleAdaptations(ids, 'all'),
    queryKey: ['wikipedia', 'article-adaptations', articleId],
  });
}
