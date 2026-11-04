import type { SubmitQuizAnswerResponse } from '@/api/generated/transport';

export type QuizQuestionType =
  'single_choice' | 'multiple_choice' | 'true_false';

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  correctOptionIds?: string[];
  explanation?: string;
  id: string;
  options: QuizOption[];
  prompt: string;
  type: QuizQuestionType;
};

// UI feedback can exist before a server answer and may include local display text.
export type QuizSubmitResult = Pick<
  SubmitQuizAnswerResponse,
  'vocabularyWord' | 'explanation' | 'isCorrect'
> & {
  correctOptionIds?: SubmitQuizAnswerResponse['correctOptionIds'];
  feedbackText?: string;
};

export type QuizSessionResult = {
  correctAnswers: number;
  durationSeconds: number;
  percentage: number;
  totalQuestions: number;
  wrongAnswers: number;
};
