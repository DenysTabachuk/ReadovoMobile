import {
  useGenerateArticleQuizMutation,
  type SimplifyArticleLevel,
  type WikipediaArticleDetail,
} from '@/features/articles/api';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

const ARTICLE_QUIZ_TARGET_LENGTH = 'medium';

/**
 * Coordinates the quiz-mode picker, explicit generation, and navigation on success.
 * Opening resets mutation state; closing is ignored while generation is pending.
 * Successful generation caches the session through the mutation, closes the picker,
 * and opens the quiz route. Failures remain available in mutation state and show a banner.
 *
 * @param article - Source article; quizzes use its original content.
 * @param selectedLevel - Level supplied when starting generation.
 * @returns Picker visibility, mutation state, open/close actions, and actions to
 * generate either an article quiz or a vocabulary quiz.
 * @example
 * // Inside a component or another hook:
 * const quiz = useArticleQuiz(article, 'A2');
 * quiz.handleOpenQuizModePicker();
 * // Opens mode selection and clears the previous mutation state.
 */
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
