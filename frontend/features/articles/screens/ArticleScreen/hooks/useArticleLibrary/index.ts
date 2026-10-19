import {
  createRecentArticleFromDetail,
  createSavedArticleFromDetail,
  isArticleSaved,
  RECENT_ARTICLES_QUERY_KEY,
  recordRecentArticle,
} from '@/features/articles';
import type { WikipediaArticleDetail } from '@/features/articles/api';
import {
  useSavedArticlesQuery,
  useToggleSavedArticleMutation,
} from '@/features/articles/api';
import { useAuth } from '@/features/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

export function useArticleLibrary(article: WikipediaArticleDetail) {
  const articleId = article.id;
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: savedArticles } = useSavedArticlesQuery(currentUser?.id);
  const isCurrentArticleSaved = isArticleSaved(articleId, savedArticles);
  const savedArticleMutation = useToggleSavedArticleMutation();
  const handleToggleSavedArticle = useCallback(() => {
    if (savedArticleMutation.isPending) {
      return;
    }

    savedArticleMutation.mutate({
      article: createSavedArticleFromDetail(article),
      saved: isCurrentArticleSaved,
    });
  }, [savedArticleMutation, article, isCurrentArticleSaved]);
  useEffect(() => {
    if (!article || !currentUser?.id) {
      return;
    }

    const recentArticle = createRecentArticleFromDetail(article);

    void recordRecentArticle(currentUser.id, recentArticle).then(
      (recentArticles) => {
        queryClient.setQueryData(
          [...RECENT_ARTICLES_QUERY_KEY, currentUser.id],
          recentArticles,
        );
      },
      (error: unknown) => {
        console.error('[ArticleScreen] Failed to record recent article', error);
      },
    );
  }, [article, currentUser?.id, queryClient]);

  return {
    isCurrentArticleSaved,
    handleToggleSavedArticle,
    isSaving: savedArticleMutation.isPending,
  };
}
