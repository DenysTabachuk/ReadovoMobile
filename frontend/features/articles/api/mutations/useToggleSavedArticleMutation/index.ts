import { useAuth } from '@/features/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SAVED_ARTICLES_QUERY_KEY } from '../../../savedArticles/constants';
import type { SavedArticle } from '../../../savedArticles/types';
import { createSavedArticlesWithArticle } from '../../../savedArticles/utils/createSavedArticlesWithArticle';
import { removeSavedArticle, saveArticleForLater } from '../../requests';
import type { WikipediaArticle } from '../../types';

type ToggleSavedArticleVariables = {
  article: WikipediaArticle;
  saved: boolean;
};

type ToggleSavedArticleContext = { previousSavedArticles?: SavedArticle[] };
type ToggleSavedArticleResult = {
  saved: boolean;
  savedArticles: SavedArticle[];
};

/**
 * Adds or removes an article with an optimistic saved-list cache update.
 * Before the request, cancels the saved-list query and snapshots its data; failure
 * restores that snapshot, while success replaces it with the server response.
 * Unauthenticated requests fail without changing the cache. Callers own outcome banners.
 *
 * @returns Mutation controls accepting an article and its saved state at click time:
 * saved=true removes it, saved=false adds it. Mounting the hook makes no request.
 * @example
 * // Inside a component or another hook:
 * const bookmark = useToggleSavedArticleMutation();
 * bookmark.mutate({ article, saved: false });
 * // Optimistically adds the article, then persists it; failure rolls the cache back.
 */
export function useToggleSavedArticleMutation() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<
    ToggleSavedArticleResult,
    Error,
    ToggleSavedArticleVariables,
    ToggleSavedArticleContext
  >({
    mutationFn: async ({ article, saved }: ToggleSavedArticleVariables) => {
      if (!currentUser?.id) throw new Error('auth.required');
      const savedArticles = saved
        ? await removeSavedArticle(article.id)
        : await saveArticleForLater(article);
      return { saved: !saved, savedArticles };
    },
    onError: (error, _variables, context) => {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (context?.previousSavedArticles) {
        queryClient.setQueryData(
          [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
          context.previousSavedArticles,
        );
      }
    },
    onMutate: async ({ article, saved }) => {
      if (!currentUser?.id) {
        return { previousSavedArticles: undefined };
      }

      await queryClient.cancelQueries({
        queryKey: [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
      });

      const previousSavedArticles =
        queryClient.getQueryData<SavedArticle[]>([
          ...SAVED_ARTICLES_QUERY_KEY,
          currentUser?.id,
        ]) ?? [];
      const nextSavedArticles = saved
        ? previousSavedArticles.filter(
            (savedArticle) => savedArticle.id !== article.id,
          )
        : createSavedArticlesWithArticle(previousSavedArticles, article);

      queryClient.setQueryData(
        [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
        nextSavedArticles,
      );

      return { previousSavedArticles };
    },
    onSuccess: (response) => {
      queryClient.setQueryData(
        [...SAVED_ARTICLES_QUERY_KEY, currentUser?.id],
        response.savedArticles,
      );
    },
  });
}
