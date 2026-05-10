export type DictionaryWordProgress = 'new' | 'in_progress' | 'learned';

export type DictionaryWord = {
  context: string;
  correctAnswersCount: number;
  createdAt: string;
  id: string;
  lastReviewedAt?: string;
  progress: DictionaryWordProgress;
  requiredCorrectAnswers: number;
  translation: string;
  userId: string;
  word: string;
};

export type CreateDictionaryWordRequest = {
  context: string;
  translation: string;
  word: string;
};

export type DictionaryTestQuestionOption = {
  id: string;
  translation: string;
};

export type DictionaryTestQuestion = {
  options: DictionaryTestQuestionOption[];
  word: string;
  wordId: string;
};

export type DictionaryTest = {
  questions: DictionaryTestQuestion[];
};

export type SubmitDictionaryTestAnswerRequest = {
  selectedOptionId: string;
  wordId: string;
};

export type UpdateDictionaryWordProgressRequest = {
  progress: DictionaryWordProgress;
};

export type DictionaryTestAnswerResult = {
  correctOptionId: string;
  correctTranslation: string;
  isCorrect: boolean;
  word: DictionaryWord;
};
