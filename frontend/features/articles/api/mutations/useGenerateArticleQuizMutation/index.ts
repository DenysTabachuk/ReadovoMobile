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
