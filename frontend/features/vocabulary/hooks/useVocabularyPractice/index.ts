import { useState } from 'react';
import type { VocabularyWordCard } from '../../fixtures/wordCards';

export type VocabularyPracticeAnswer = {
  questionId: string;
  word: VocabularyWordCard;
  selectedOptionId: string;
  isCorrect: boolean;
};

type PracticeQuestion = {
  id: string;
  word: VocabularyWordCard;
  options: readonly VocabularyWordCard[];
};

type PracticeState = {
  questionIndex: number;
  selectedOptionId: string | null;
  answers: VocabularyPracticeAnswer[];
};

/**
 * Manages a local choose/check/advance vocabulary-practice attempt without saving it.
 * Checks are idempotent; stale events cannot change another question or score.
 * @param questions - Stable local questions; keep the same set for the mounted attempt.
 * @returns Current question, selection, checked answer, results and guarded actions.
 * @example
 * const practice = useVocabularyPractice(PICTURE_PRACTICE_QUESTIONS);
 * practice.selectOption('picture-backpack', 'backpack');
 * practice.checkAnswer('picture-backpack'); // Records one correct answer.
 */
export function useVocabularyPractice<Question extends PracticeQuestion>(
  questions: readonly Question[],
) {
  const [state, setState] = useState<PracticeState>({
    questionIndex: 0,
    selectedOptionId: null,
    answers: [],
  });
  const question = questions[state.questionIndex];
  const answer = state.answers[state.questionIndex];

  const selectOption = (questionId: string, optionId: string) => {
    setState((current) => {
      const activeQuestion = questions[current.questionIndex];
      if (
        !activeQuestion ||
        activeQuestion.id !== questionId ||
        current.answers[current.questionIndex]
      )
        return current;
      if (!activeQuestion.options.some((option) => option.id === optionId))
        return current;
      return { ...current, selectedOptionId: optionId };
    });
  };

  const checkAnswer = (questionId: string) => {
    setState((current) => {
      const activeQuestion = questions[current.questionIndex];
      if (
        !activeQuestion ||
        activeQuestion.id !== questionId ||
        current.selectedOptionId === null ||
        current.answers[current.questionIndex]
      )
        return current;
      const checkedAnswer: VocabularyPracticeAnswer = {
        questionId,
        word: activeQuestion.word,
        selectedOptionId: current.selectedOptionId,
        isCorrect: current.selectedOptionId === activeQuestion.word.id,
      };
      return { ...current, answers: [...current.answers, checkedAnswer] };
    });
  };

  const advance = (questionId: string) => {
    setState((current) => {
      const activeQuestion = questions[current.questionIndex];
      if (
        !activeQuestion ||
        activeQuestion.id !== questionId ||
        !current.answers[current.questionIndex]
      )
        return current;
      return {
        ...current,
        questionIndex: current.questionIndex + 1,
        selectedOptionId: null,
      };
    });
  };

  const restart = () =>
    setState({ questionIndex: 0, selectedOptionId: null, answers: [] });

  return {
    question,
    questionIndex: state.questionIndex,
    selectedOptionId: state.selectedOptionId,
    answer,
    answers: state.answers,
    correctCount: state.answers.filter(
      (checkedAnswer) => checkedAnswer.isCorrect,
    ).length,
    total: questions.length,
    isComplete: state.questionIndex === questions.length,
    selectOption,
    checkAnswer,
    advance,
    restart,
  };
}
