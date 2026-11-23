import { useRef } from 'react';
import type {
  VocabularyLevel,
  VocabularyPracticeQuestion,
} from '@/api/generated/transport';
import { useCheckVocabularyAnswerMutation } from '../../../../api/mutations/useCheckVocabularyAnswerMutation';
import { useVocabularyPractice } from '../useVocabularyPractice';

type PracticeSessionInput = {
  lessonSlug: string;
  level: VocabularyLevel;
  questions: readonly VocabularyPracticeQuestion[];
};

/**
 * Coordinates one practice attempt with server-side answer checking.
 *
 * @param input - Lesson slug, level, and stable questions for this attempt.
 * @returns Practice state, check status, and actions to select, submit, or restart.
 * A failed check preserves the selection so the same answer can be retried.
 * @example
 * const { selectOption, submit } = usePracticeSession({ lessonSlug, level, questions });
 * // Bind selectOption to the choices and submit to the primary button.
 * // The first press checks the selection. After feedback, the next press advances.
 */
export function usePracticeSession({
  lessonSlug,
  level,
  questions,
}: PracticeSessionInput) {
  const practice = useVocabularyPractice(questions);
  const { mutate, isPending, error, reset } = useCheckVocabularyAnswerMutation(
    lessonSlug,
    level,
  );
  const checking = useRef(false);
  const { question, answer, selectedOptionId } = practice;

  const selectOption = (optionId: string) => {
    if (!question || checking.current || answer) return;
    reset();
    practice.selectOption(question.id, optionId);
  };

  const submit = () => {
    if (!question || checking.current) return;
    if (answer) {
      reset();
      practice.advance(question.id);
      return;
    }
    if (selectedOptionId === null) return;

    // Block repeated taps before React Query can render the pending state.
    checking.current = true;
    mutate(
      { questionId: question.id, optionId: selectedOptionId },
      {
        onSuccess: (feedback) => practice.recordAnswer(feedback),
        onSettled: () => {
          checking.current = false;
        },
      },
    );
  };

  const restart = () => {
    reset();
    practice.restart();
  };

  return {
    practice,
    isSubmitting: isPending,
    hasCheckError: error !== null,
    isPrimaryActionDisabled: isPending || selectedOptionId === null,
    selectOption,
    submit,
    restart,
  };
}
