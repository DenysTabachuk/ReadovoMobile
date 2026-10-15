import { type QuizSessionResult } from '../../../../types';

const MILLISECONDS_PER_SECOND = 1000;
const MINIMUM_DURATION_SECONDS = 1;
const PERCENTAGE_SCALE = 100;

type CreateQuizSessionResultParams = {
  correctAnswers: number;
  finishedAt: number;
  startedAt: number;
  totalQuestions: number;
};

export function createQuizSessionResult({
  correctAnswers,
  finishedAt,
  startedAt,
  totalQuestions,
}: CreateQuizSessionResultParams): QuizSessionResult {
  return {
    correctAnswers,
    durationSeconds: Math.max(
      MINIMUM_DURATION_SECONDS,
      Math.round((finishedAt - startedAt) / MILLISECONDS_PER_SECOND),
    ),
    percentage: Math.round(
      (correctAnswers / totalQuestions) * PERCENTAGE_SCALE,
    ),
    totalQuestions,
    wrongAnswers: totalQuestions - correctAnswers,
  };
}
