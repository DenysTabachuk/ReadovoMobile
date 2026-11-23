import type {
  LearningVocabulary,
  CheckVocabularyAnswerResponse,
} from '@/api/generated/transport';
import { createVocabularyWords } from './wordFixtures';

/**
 * Builds fresh mixed-format HTTP test data, outside the application data path.
 * @returns Three unanswered questions using sample word IDs from the lesson factory.
 * @example
 * createVocabularyPractice().questions.length; // => 3
 */
export function createVocabularyPractice(): Pick<
  LearningVocabulary,
  'questions'
> {
  const words = createVocabularyWords().slice(0, 3);
  const kinds = [
    'word_to_picture',
    'audio_to_picture',
    'sentence_gap',
  ] as const;
  return {
    questions: words.map((word, index) => {
      const kind = kinds[index];
      return {
        id: `exercise-${index + 1}`,
        kind,
        prompt: kind === 'sentence_gap' ? null : word.word,
        sentenceBefore: kind === 'sentence_gap' ? 'I see a ' : null,
        sentenceAfter: kind === 'sentence_gap' ? '.' : null,
        options: words.map((option) => ({
          id: option.id,
          word: option.word,
          imageKey: option.imageKey,
          imageUrl: option.imageUrl,
        })),
      };
    }),
  };
}

/**
 * Builds known server feedback for a test question; production checking is remote.
 * @param questionIndex - Zero-based question index from the test practice factory.
 * @param optionId - Selected test option ID.
 * @returns Matching correct/incorrect feedback with a literal learner translation.
 * @example
 * createVocabularyFeedback(0,'word-1').isCorrect; // => true
 */
export function createVocabularyFeedback(
  questionIndex: number,
  optionId: string,
): CheckVocabularyAnswerResponse {
  const word = createVocabularyWords()[questionIndex];
  return {
    questionId: `exercise-${questionIndex + 1}`,
    selectedOptionId: optionId,
    correctOptionId: word.id,
    isCorrect: word.id === optionId,
    word,
    sentenceTranslationUk:
      questionIndex === 2 ? 'Translated complete sentence' : null,
  };
}
