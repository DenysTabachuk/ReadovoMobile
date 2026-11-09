import { useState } from 'react';
import { PICTURE_PRACTICE_QUESTIONS } from '../../fixtures/picturePractice';
import type { VocabularyWordCard } from '../../fixtures/wordCards';

export type PicturePracticeAnswer = {
  questionId: string;
  word: VocabularyWordCard;
  selectedOptionId: string;
  isCorrect: boolean;
};

type PracticeState = {
  questionIndex: number;
  selectedOptionId: string | null;
  answers: PicturePracticeAnswer[];
};

/**
 * Manages a local choose/check/advance picture-practice attempt without saving it.
 * Checks are idempotent; stale events cannot change another question or score.
 * @returns Current question, selection, checked answer, results and guarded actions.
 * @example
 * const practice = usePicturePractice();
 * practice.selectOption('picture-backpack', 'backpack');
 * practice.checkAnswer('picture-backpack'); // Records one correct answer.
 */
export function usePicturePractice() {
  const [state, setState] = useState<PracticeState>({
    questionIndex: 0,
    selectedOptionId: null,
    answers: [],
  });
  const question = PICTURE_PRACTICE_QUESTIONS[state.questionIndex];
  const answer = state.answers[state.questionIndex];

  const selectOption = (questionId: string, optionId: string) => {
    setState((current) => {
      const activeQuestion = PICTURE_PRACTICE_QUESTIONS[current.questionIndex];
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
      const activeQuestion = PICTURE_PRACTICE_QUESTIONS[current.questionIndex];
      if (
        !activeQuestion ||
        activeQuestion.id !== questionId ||
        current.selectedOptionId === null ||
        current.answers[current.questionIndex]
      )
        return current;
      const checkedAnswer: PicturePracticeAnswer = {
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
      const activeQuestion = PICTURE_PRACTICE_QUESTIONS[current.questionIndex];
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
    total: PICTURE_PRACTICE_QUESTIONS.length,
    isComplete: state.questionIndex === PICTURE_PRACTICE_QUESTIONS.length,
    selectOption,
    checkAnswer,
    advance,
    restart,
  };
}
