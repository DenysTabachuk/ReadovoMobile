import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  generateArticleQuiz,
  type SimplifyArticleLevel,
  type WikipediaArticleDetail,
} from '@/api/wikipedia';
import { useBanner } from '@/components/banner';
import { resolveEffectiveTargetLength } from '../resolveEffectiveArticleLength';
import { type ArticleQuizLengthParam } from '../types';

type UseGenerateArticleQuizParams = {
  article?: WikipediaArticleDetail;
  quizLevel: SimplifyArticleLevel;
  quizTargetLength: ArticleQuizLengthParam;
};

export function useGenerateArticleQuiz({
  article,
  quizLevel,
  quizTargetLength,
}: UseGenerateArticleQuizParams) {
  const { t } = useTranslation();
  const { showBanner } = useBanner();

  return useMutation({
    mutationFn: async () => {
      if (!article) {
        throw new Error('Article is unavailable.');
      }

      const targetLength = resolveEffectiveTargetLength(
        quizTargetLength,
        article.content,
      );

      return generateArticleQuiz({
        level: quizLevel,
        targetLength,
        text: article.content,
        title: article.title,
      });
    },
    onError: () => {
      showBanner({
        title: t('article.quiz.error', {
          defaultValue: 'Could not generate quiz. Try again.',
        }),
        variant: 'error',
      });
    },
  });
}
