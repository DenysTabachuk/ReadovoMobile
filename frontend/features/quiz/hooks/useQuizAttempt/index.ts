import { useRef, useState } from 'react';

type QuizSelection = [string, ...string[]];
type AnswerFeedback = { isCorrect: boolean };
type CheckSelection<Feedback> = (
  selection: QuizSelection,
  callbacks: {
    onSuccess: (feedback: Feedback) => void;
    onSettled: () => void;
  },
) => void;

/**
 * Tracks a quiz attempt and coordinates selection, checking, and question transitions.
 *
 * @returns The current index, selection, feedback, score, and attempt actions.
 * A failed check preserves the selection. Callers supply the check and decide
 * what happens after the last question.
 * @example
 * const attempt = useQuizAttempt<QuizSubmitResult>();
 * // A choice handler calls attempt.selectOption(optionId).
 * // On submit, pass the supplied callbacks to the answer mutation.
 */
export function useQuizAttempt<Feedback extends AnswerFeedback>() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [answer, setAnswer] = useState<Feedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track the phase synchronously so taps cannot get ahead of React's next render.
  const phase = useRef<'ready' | 'checking' | 'answered'>('ready');

  const selectOption = (optionId: string, multiple = false) => {
    if (phase.current !== 'ready') return false;
    if (multiple) {
      setSelectedOptionIds((current) =>
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
    return true;
  };

  const submitAnswer = (checkSelection: CheckSelection<Feedback>) => {
    const [firstOptionId, ...otherOptionIds] = selectedOptionIds;
    if (phase.current !== 'ready' || firstOptionId === undefined) return;
    phase.current = 'checking';
    setIsSubmitting(true);

    const onSettled = () => {
      if (phase.current === 'checking') phase.current = 'ready';
      setIsSubmitting(false);
    };
    try {
      checkSelection([firstOptionId, ...otherOptionIds], {
        onSuccess: (feedback) => {
          if (phase.current !== 'checking') return;
          phase.current = 'answered';
          setAnswer(feedback);
          if (feedback.isCorrect) setCorrectCount((count) => count + 1);
        },
        onSettled,
      });
    } catch (error) {
      onSettled();
      throw error;
    }
  };

  const clearQuestion = () => {
    phase.current = 'ready';
    setSelectedOptionIds([]);
    setAnswer(null);
  };

  const advance = () => {
    if (phase.current !== 'answered' || isSubmitting) return false;
    setQuestionIndex((index) => index + 1);
    clearQuestion();
    return true;
  };

  const restart = () => {
    if (phase.current === 'checking' || isSubmitting) return;
    setQuestionIndex(0);
    setCorrectCount(0);
    clearQuestion();
  };

  return {
    questionIndex,
    selectedOptionIds,
    answer,
    correctCount,
    isSubmitting,
    selectOption,
    submitAnswer,
    advance,
    restart,
  };
}
