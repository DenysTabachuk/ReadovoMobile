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
  context?: string;
  translation?: string;
  word?: string;
};

export type GenerateEmbeddingRequest = {
  text?: string;
};

export type SimilarWordsRequest = {
  word?: string;
  wordList?: string[];
};

export type QuizOptionsRequest = {
  correctWord?: string;
  wordList?: string[];
};

export type DictionaryTestQuestionOption = {
  id: string;
  text: string;
  translation: string;
};

export type DictionaryTestQuestionFormat =
  | 'translation'
  | 'reverse_translation'
  | 'cloze';

export type DictionaryTestQuestion = {
  format: DictionaryTestQuestionFormat;
  options: DictionaryTestQuestionOption[];
  prompt: string;
  word: string;
  wordId: string;
};

export type DictionaryTest = {
  questions: DictionaryTestQuestion[];
};

export type SubmitDictionaryTestAnswerRequest = {
  selectedOptionId?: string;
  wordId?: string;
};

export type UpdateDictionaryWordProgressRequest = {
  progress?: DictionaryWordProgress;
};

export type DictionaryTestAnswerResult = {
  correctOptionId: string;
  correctTranslation: string;
  isCorrect: boolean;
  word: DictionaryWord;
};
