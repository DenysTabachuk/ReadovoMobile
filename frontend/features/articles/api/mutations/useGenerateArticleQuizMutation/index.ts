import { useBanner } from '@/components/banner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  onSuccess: (
    mode: ArticleQuizMode,
    resolvedLevel: SimplifyArticleLevel,
  ) => void;
};

const ARTICLE_QUIZ_TARGET_LENGTH = 'medium';

/**
 * Generates the requested quiz mode from original article content on mutate.
 * Caches a successful session by article, mode, level, and target length before
 * invoking the caller's success callback. Failures show an error banner.
 *
 * @param params - Source article, generation level, and callback receiving the
 * completed mode/level so the caller can handle navigation or other UI effects.
 * @returns Mutation controls accepting 'article' or 'vocabulary'; mounting the
 * hook does not generate a quiz. Article quizzes use the medium target length.
 * @example
 * // Inside a component or another hook:
 * const quiz = useGenerateArticleQuizMutation({ article, selectedLevel: 'A2', onSuccess: openQuiz });
 * quiz.mutate('vocabulary');
 * // Generates vocabulary questions, caches the session, then calls openQuiz on success.
 */
export function useGenerateArticleQuizMutation({
  article,
  selectedLevel,
  onSuccess,
}: UseGenerateArticleQuizMutationParams) {
  const articleId = article.id;
  const { t } = useTranslation();
  const { showBanner } = useBanner();
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
    onError: () => {
      showBanner({
        title: t('article.quiz.error'),
        variant: 'error',
      });
    },
    onSuccess: ({ mode, response, resolvedLevel }) => {
      queryClient.setQueryData(
        getArticleQuizSessionKey(
          articleId,
          mode,
          resolvedLevel,
          ARTICLE_QUIZ_TARGET_LENGTH,
        ),
        response,
      );
      onSuccess(mode, resolvedLevel);
    },
  });
}
