import { useAuth } from '@/features/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RECENT_ARTICLES_QUERY_KEY } from '../../../recentArticles/constants';
import { SAVED_ARTICLES_QUERY_KEY } from '../../../savedArticles/constants';
import { stripDuplicateTitleHeading } from '../../../utils/stripDuplicateTitleHeading';
import { simplifyWikipediaArticle } from '../../requests';
import type {
  ArticleTextTransformationType,
  SimplifyArticleLevel,
  WikipediaArticleDetail,
} from '../../types';
import { createSimplificationRequestBlocks } from './utils/createSimplificationRequestBlocks';

type UseSimplifyArticleMutationParams = {
  article: WikipediaArticleDetail;
  selectedLevel: SimplifyArticleLevel;
};

/**
 * Requests an adaptation or summary at the selected level when explicitly mutated.
 * Prepares article blocks for transport, then invalidates article lists, adaptation
 * availability, and the user's recent/saved lists on success. Callers own UI
 * feedback through component-bound mutate callbacks.
 *
 * @param params - Source article and generation level.
 * @returns Mutation controls accepting 'adaptation' or 'summary', with pending/error
 * state. Invalidation schedules refreshes; the callback does not await those refreshes.
 * @example
 * // Inside a component or another hook:
 * const simplify = useSimplifyArticleMutation({ article, selectedLevel: 'B1' });
 * simplify.mutate('summary', { onSuccess: applyVersion });
 * // Requests a B1 summary and passes its response to applyVersion on success.
 */
export function useSimplifyArticleMutation({
  article,
  selectedLevel,
}: UseSimplifyArticleMutationParams) {
  const { currentUser } = useAuth();
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
    onSuccess: () => {
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
    },
  });
}
