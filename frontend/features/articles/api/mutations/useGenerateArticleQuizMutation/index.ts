import { useAuth } from '@/features/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getArticleQuizSessionKey,
  type ArticleQuizMode,
} from '../../../articleQuizSession';
import {
  generateArticleQuiz,
  generateArticleVocabularyQuiz,
} from '../../requests';
import type { SimplifyArticleLevel, WikipediaArticleDetail } from '../../types';

type UseGenerateArticleQuizMutationParams = {
  article: WikipediaArticleDetail;
  selectedLevel: SimplifyArticleLevel;
};

const ARTICLE_QUIZ_TARGET_LENGTH = 'medium';

/**
 * Generates the requested quiz mode from original article content on mutate.
 * Caches a successful session by owner, article, mode, level, and target length.
 * Screen feedback and navigation belong in per-call mutate callbacks.
 *
 * @param params - Source article and generation level.
 * @returns Mutation controls accepting 'article' or 'vocabulary'; mounting the
 * hook does not generate a quiz. Article quizzes use the medium target length.
 * @example
 * // Inside a component or another hook:
 * const quiz = useGenerateArticleQuizMutation({ article, selectedLevel: 'A2' });
 * quiz.mutate('vocabulary', { onSuccess: openQuiz });
 * // Generates vocabulary questions, caches the session, then calls openQuiz while the screen remains mounted.
 */
export function useGenerateArticleQuizMutation({
  article,
  selectedLevel,
}: UseGenerateArticleQuizMutationParams) {
  const articleId = article.id;
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: ArticleQuizMode) => {
      if (mode === 'vocabulary') {
        const response = await generateArticleVocabularyQuiz({
          level: selectedLevel,
          text: article.content,
          title: article.title,
        });

        return {
          mode,
          response,
          resolvedLevel: selectedLevel,
        };
      }

      const response = await generateArticleQuiz({
        level: selectedLevel,
        targetLength: ARTICLE_QUIZ_TARGET_LENGTH,
        text: article.content,
        title: article.title,
      });

      return {
        mode,
        response,
        resolvedLevel: selectedLevel,
      };
    },
    onSuccess: ({ mode, response, resolvedLevel }) => {
      queryClient.setQueryData(
        getArticleQuizSessionKey({
          userId: currentUser?.id ?? undefined,
          articleId,
          mode,
          level: resolvedLevel,
          targetLength: ARTICLE_QUIZ_TARGET_LENGTH,
        }),
        response,
      );
    },
  });
}
