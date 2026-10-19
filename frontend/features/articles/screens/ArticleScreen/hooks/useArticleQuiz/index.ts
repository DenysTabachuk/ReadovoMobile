import {
  useGenerateArticleQuizMutation,
  type SimplifyArticleLevel,
  type WikipediaArticleDetail,
} from '@/features/articles/api';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

const ARTICLE_QUIZ_TARGET_LENGTH = 'medium';

export function useArticleQuiz(
  article: WikipediaArticleDetail,
  selectedLevel: SimplifyArticleLevel,
) {
  const articleId = article.id;
  const router = useRouter();
  const [isQuizModePickerOpen, setIsQuizModePickerOpen] = useState(false);
  const quizMutation = useGenerateArticleQuizMutation({
    article,
    selectedLevel,
    onSuccess: (mode, resolvedLevel) => {
      setIsQuizModePickerOpen(false);
      router.push({
        params: {
          id: String(articleId),
          level: resolvedLevel,
          mode,
          targetLength: ARTICLE_QUIZ_TARGET_LENGTH,
        },
        pathname: '/article-quiz/[id]',
      });
    },
  });
  const handleOpenQuizModePicker = useCallback(() => {
    quizMutation.reset();
    setIsQuizModePickerOpen(true);
  }, [quizMutation]);

  const handleCloseQuizModePicker = useCallback(() => {
    if (quizMutation.isPending) {
      return;
    }

    setIsQuizModePickerOpen(false);
  }, [quizMutation.isPending]);

  const handleGenerateArticleQuiz = useCallback(() => {
    quizMutation.mutate('article');
  }, [quizMutation]);

  const handleGenerateVocabularyQuiz = useCallback(() => {
    quizMutation.mutate('vocabulary');
  }, [quizMutation]);

  return {
    quizMutation,
    isQuizModePickerOpen,
    handleOpenQuizModePicker,
    handleCloseQuizModePicker,
    handleGenerateArticleQuiz,
    handleGenerateVocabularyQuiz,
  };
}
