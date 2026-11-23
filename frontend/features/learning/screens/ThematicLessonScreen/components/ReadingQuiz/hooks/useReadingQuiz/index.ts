import type {
  CheckReadingAnswerResponse,
  LearningReadingQuestion,
  VocabularyLevel,
} from '@/api/generated/transport';
import { useQuizAttempt } from '@/features/quiz';
import { useCheckReadingAnswerMutation } from '../../../../../../api/mutations/useCheckReadingAnswerMutation';

type ReadingQuizInput = {
  slug: string;
  level: VocabularyLevel;
  questions: readonly LearningReadingQuestion[];
  onComplete: () => void;
};

/**
 * Coordinates question selection, server checks, and navigation through the quiz.
 *
 * @param input - Lesson identity, questions, and callback after the last checked answer.
 * @returns The active question, feedback, score, and actions to select, submit, or restart.
 * A failed check preserves the selection for retry. Completion is triggered when the
 * user advances from the last checked question.
 * @example
 * const { selectOption, submit } = useReadingQuiz({ slug, level, questions, onComplete });
 * // Bind selectOption to the choices and submit to the primary button.
 * // After feedback arrives, that button advances to the next question.
 */
export function useReadingQuiz({
  slug,
  level,
  questions,
  onComplete,
}: ReadingQuizInput) {
  const { mutate, error, reset } = useCheckReadingAnswerMutation();
  const {
    questionIndex,
    selectedOptionIds,
    answer,
    correctCount,
    isSubmitting,
    selectOption: selectChoice,
    submitAnswer,
    advance,
    restart: restartAttempt,
  } = useQuizAttempt<CheckReadingAnswerResponse>();
  const question = questions[questionIndex];
  const position = questionIndex + 1;

  const selectOption = (optionId: string) => {
    if (selectChoice(optionId)) reset();
  };

  const submit = () => {
    if (!question) return;
    if (answer) {
      if (!advance()) return;
      if (position === questions.length) onComplete();
      reset();
      return;
    }
    submitAnswer(([optionId], callbacks) =>
      mutate({ slug, level, questionId: question.id, optionId }, callbacks),
    );
  };

  const restart = () => {
    reset();
    restartAttempt();
  };

  return {
    question,
    answer,
    position,
    selectedOptionId: selectedOptionIds[0] ?? null,
    correctCount,
    isSubmitting,
    hasCheckError: error !== null,
    selectOption,
    submit,
    restart,
  };
}
