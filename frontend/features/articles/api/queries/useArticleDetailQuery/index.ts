import { useQuery } from '@tanstack/react-query';
import { fetchWikipediaArticleDetail } from '../../requests';

export function useArticleDetailQuery(articleId: number | null) {
  return useQuery({
    enabled: articleId !== null,
    queryFn: async () => {
      if (articleId === null) {
        throw new Error('article.invalidId');
      }

      return fetchWikipediaArticleDetail(articleId);
    },
    queryKey: ['wikipedia', 'article', articleId],
  });
}
