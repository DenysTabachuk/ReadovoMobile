import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchWikipediaArticleDetail } from '@/api/wikipedia';
import { useBanner } from '@/components/banner';

type UseFetchWikipediaArticleDetailParams = {
  articleId: number | null;
};

export function useFetchWikipediaArticleDetail({
  articleId,
}: UseFetchWikipediaArticleDetailParams) {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const query = useQuery({
    enabled: articleId !== null,
    queryFn: async () => {
      if (articleId === null) {
        throw new Error('article.invalidId');
      }

      return fetchWikipediaArticleDetail(articleId);
    },
    queryKey: ['wikipedia', 'article', articleId],
  });

  useEffect(() => {
    if (!query.isError) {
      return;
    }

    showBanner({
      title: t('article.errorDescription'),
      variant: 'error',
    });
  }, [query.isError, showBanner, t]);

  return query;
}
