import { useBanner } from '@/components/banner';
import { useAuth } from '@/features/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RECENT_ARTICLES_QUERY_KEY } from '../../../recentArticles/constants';
import { SAVED_ARTICLES_QUERY_KEY } from '../../../savedArticles/constants';
import { stripDuplicateTitleHeading } from '../../../utils/stripDuplicateTitleHeading';
import { simplifyWikipediaArticle } from '../../requests';
import type {
  ArticleTextTransformationType,
  SimplifyArticleLevel,
  SimplifyArticleResponse,
  WikipediaArticleDetail,
} from '../../types';
import { createSimplificationRequestBlocks } from './utils/createSimplificationRequestBlocks';

type UseSimplifyArticleMutationParams = {
  article: WikipediaArticleDetail;
  selectedLevel: SimplifyArticleLevel;
  onSuccess: (response: SimplifyArticleResponse) => void;
};

export function useSimplifyArticleMutation({
  article,
  selectedLevel,
  onSuccess,
}: UseSimplifyArticleMutationParams) {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transformationType: ArticleTextTransformationType) => {
      return simplifyWikipediaArticle({
        articleId: article.id,
        blocks: createSimplificationRequestBlocks(
          stripDuplicateTitleHeading(article.blocks, article.title),
        ),
        level: selectedLevel,
        text: article.content,
        title: article.title,
        transformationType,
      });
    },
    onError: (mutationError, transformationType) => {
      console.error('[ArticleScreen] Failed to adapt article', mutationError);
      showBanner({
        title:
          transformationType === 'adaptation'
            ? t('article.adaptError')
            : t('article.summaryError'),
        variant: 'error',
      });
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: [...RECENT_ARTICLES_QUERY_KEY, currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['wikipedia', 'article-adaptations'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['wikipedia', 'articles'],
      });
      onSuccess(response);
    },
  });
}
