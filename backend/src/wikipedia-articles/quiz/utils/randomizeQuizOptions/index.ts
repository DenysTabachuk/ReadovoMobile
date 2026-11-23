import { randomUUID } from 'node:crypto';
import type { ArticleQuizQuestion } from '../../../contracts/types';

/**
 * Gives options fresh opaque IDs and a random order while preserving the answer key.
 * @param question - Validated question with its private correct-option IDs.
 * @returns A new question; the input and its options are not mutated.
 * Sorting fresh UUIDs randomizes position so neither IDs nor order identify the answer.
 * @example
 * const quiz = randomizeQuizOptions({
 *   id: 'q1', type: 'single_choice', prompt: 'Translate forest.',
 *   options: [{ id: 'correct', text: 'ліс' }, { id: 'wrong', text: 'гора' }],
 *   correctOptionIds: ['correct'],
 * });
 * quiz.options.find(option => quiz.correctOptionIds.includes(option.id))?.text; // => 'ліс'
 */
export function randomizeQuizOptions<TQuestion extends ArticleQuizQuestion>(
  question: TQuestion,
): Omit<TQuestion, 'options' | 'correctOptionIds'> &
  Pick<ArticleQuizQuestion, 'options' | 'correctOptionIds'> {
  const optionsWithCorrectness = question.options.map((option) => ({
    option: { ...option, id: randomUUID() },
    isCorrect: question.correctOptionIds.includes(option.id),
  }));
  optionsWithCorrectness.sort((first, second) =>
    first.option.id.localeCompare(second.option.id),
  );

  return {
    ...question,
    options: optionsWithCorrectness.map(({ option }) => option),
    correctOptionIds: optionsWithCorrectness
      .filter(({ isCorrect }) => isCorrect)
      .map(({ option }) => option.id),
  };
}
