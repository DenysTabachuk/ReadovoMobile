import {
  useDictionaryMutationFeedback,
  useCreateDictionaryWordMutation,
} from '@/features/dictionary';
import { useState } from 'react';
import type { VocabularyWordQuestion } from '../../types';

/**
 * Tracks dictionary saves for the current mounted quiz session.
 * Saves start only through saveWord; calls while the mutation is pending are ignored.
 * Only successful saves mark a question as saved. Failures leave it retryable and
 * are presented by component-bound dictionary feedback.
 *
 * @param articleTitle - Dictionary context when a question has no source excerpt.
 * @returns Saved question IDs, the currently saving ID, and the explicit save action.
 * @example
 * // Inside a component or another hook:
 * const vocabulary = useQuizVocabulary(article.title);
 * vocabulary.saveWord(question);
 * // Saves the word and marks its question as saved after success.
 */
export function useQuizVocabulary(articleTitle: string) {
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const mutation = useCreateDictionaryWordMutation();
  const { onSaved: showWordSavedBanner, onError: showDictionaryErrorBanner } =
    useDictionaryMutationFeedback();

  const saveWord = (question: VocabularyWordQuestion) => {
    if (mutation.isPending) return;
    setSavingQuestionId(question.id);
    mutation.mutate(
      {
        context: question.sourceExcerpt ?? articleTitle,
        translation: question.translation,
        word: question.term,
      },
      {
        onSuccess: () => {
          setSavedQuestionIds((current) => new Set(current).add(question.id));
          showWordSavedBanner();
        },
        onError: showDictionaryErrorBanner,
        onSettled: () => setSavingQuestionId(null),
      },
    );
  };

  return { savedQuestionIds, savingQuestionId, saveWord };
}
