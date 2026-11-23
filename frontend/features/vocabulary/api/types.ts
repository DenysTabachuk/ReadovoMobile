import type { CheckLearningAnswerRequest } from '@/api/generated/transport';

export type VocabularyAnswerSubmission = {
  questionId: string;
  optionId: CheckLearningAnswerRequest['optionId'];
};
