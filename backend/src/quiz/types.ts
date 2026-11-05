import { type QuizVocabularyWordDto } from './dto/submit-quiz-answer-response.dto';

type QuizKind = 'article' | 'vocabulary' | 'dictionary';
export type QuizLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type QuizLength = 'short' | 'medium' | 'long';

type QuizVocabularyWord = QuizVocabularyWordDto;

type QuizQuestionSnapshot = {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
  optionIds: string[];
  correctOptionIds: string[];
  explanation?: string;
  wordId?: string;
  vocabularyWord?: QuizVocabularyWord;
};

export type { SubmitQuizAnswerResponseDto as QuizAnswerResult } from './dto/submit-quiz-answer-response.dto';
export type { CompleteQuizResponseDto as QuizCompletionResponse } from './dto/complete-quiz-response.dto';

export type CreateQuizSessionInput = {
  kind: QuizKind;
  level?: QuizLevel;
  targetLength?: QuizLength;
  questions: QuizQuestionSnapshot[];
};
