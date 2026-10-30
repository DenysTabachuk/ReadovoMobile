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

export type QuizSubmitResult = {
  vocabularyWord?: {
    term: string;
    translation: string;
    sourceExcerpt?: string;
  };
  correctOptionIds?: string[];
  explanation?: string;
  feedbackText?: string;
  isCorrect: boolean;
};

export type QuizSessionResult = {
  correctAnswers: number;
  durationSeconds: number;
  percentage: number;
  totalQuestions: number;
  wrongAnswers: number;
};
