export type QuizKind = 'article' | 'vocabulary' | 'dictionary';
export type QuizLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type QuizLength = 'short' | 'medium' | 'long';

export type QuizQuestionSnapshot = {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
  optionIds: string[];
  correctOptionIds: string[];
  explanation?: string;
  wordId?: string;
};

export type QuizAnswerResult = {
  newlyUnlockedAchievementIds: string[];
  correctOptionIds: string[];
  explanation?: string;
  isCorrect: boolean;
};

export type CreateQuizSessionInput = {
  kind: QuizKind;
  level?: QuizLevel;
  targetLength?: QuizLength;
  questions: QuizQuestionSnapshot[];
};
