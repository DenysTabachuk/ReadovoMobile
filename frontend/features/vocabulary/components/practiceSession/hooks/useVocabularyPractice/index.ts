import { useState } from 'react';
import type {
  CheckVocabularyAnswerResponse,
  VocabularyPracticeQuestion,
} from '@/api/generated/transport';

type PracticeState = {
  questionIndex: number;
  selectedOptionId: string | null;
  answers: CheckVocabularyAnswerResponse[];
};

/**
 * Keeps a temporary attempt while the server owns answer checking.
 * @param questions - Stable validated questions for this mounted attempt.
 * @returns Selection, server feedback, score and guarded select/record/advance/restart actions.
 * Stale events, duplicate feedback and choices outside the active question are ignored.
 * @example
 * const practice = useVocabularyPractice(questions);
 * practice.selectOption(questions[0].id, questions[0].options[0].id);
 * // Submit through the data mutation; its per-call onSuccess calls practice.recordAnswer(feedback).
 */
export function useVocabularyPractice(
  questions: readonly VocabularyPracticeQuestion[],
) {
  const [state, setState] = useState<PracticeState>({
    questionIndex: 0,
    selectedOptionId: null,
    answers: [],
  });
  const question = questions[state.questionIndex];
  const answer = state.answers[state.questionIndex];
  const selectOption = (questionId: string, optionId: string) =>
    setState((current) => {
      const active = questions[current.questionIndex];
      if (
        !active ||
        active.id !== questionId ||
        current.answers[current.questionIndex] ||
        !active.options.some((option) => option.id === optionId)
      )
        return current;
      return { ...current, selectedOptionId: optionId };
    });
  const recordAnswer = (feedback: CheckVocabularyAnswerResponse) =>
    setState((current) => {
      const active = questions[current.questionIndex];
      if (
        !active ||
        active.id !== feedback.questionId ||
        current.selectedOptionId !== feedback.selectedOptionId ||
        current.answers[current.questionIndex]
      )
        return current;
      return { ...current, answers: [...current.answers, feedback] };
    });
  const advance = (questionId: string) =>
    setState((current) => {
      const active = questions[current.questionIndex];
      if (
        !active ||
        active.id !== questionId ||
        !current.answers[current.questionIndex]
      )
        return current;
      return {
        ...current,
        questionIndex: current.questionIndex + 1,
        selectedOptionId: null,
      };
    });
  const restart = () =>
    setState({ questionIndex: 0, selectedOptionId: null, answers: [] });
  return {
    question,
    questionIndex: state.questionIndex,
    selectedOptionId: state.selectedOptionId,
    answer,
    answers: state.answers,
    correctCount: state.answers.filter((feedback) => feedback.isCorrect).length,
    total: questions.length,
    isComplete: state.questionIndex === questions.length,
    selectOption,
    recordAnswer,
    advance,
    restart,
  };
}
