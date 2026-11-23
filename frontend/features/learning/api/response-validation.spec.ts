import {
  isCheckVocabularyAnswerResponse,
  isGetLearningCatalogueResponse,
  isGetLearningLessonResponse,
} from '@/api/generated/learning-validators';
import { createVocabularyFeedback } from '../../vocabulary/testing/practiceFixtures';
import {
  createCatalogue,
  createLesson,
} from '../testing/learningResponseFixtures';

it('accepts a catalogue root and rejects malformed nested topics', () => {
  const catalogue = createCatalogue();
  expect(isGetLearningCatalogueResponse(catalogue)).toBe(true);
  expect(isGetLearningCatalogueResponse({ ...catalogue, topics: [null] })).toBe(
    false,
  );
});

it('accepts a missing level and validates the embedded vocabulary of available variants', () => {
  const lesson = createLesson();
  const variant = lesson.variant;
  if (!variant) throw new Error('Fixture requires a variant');
  expect(isGetLearningLessonResponse({ ...lesson, variant: null })).toBe(true);
  expect(isGetLearningLessonResponse(lesson)).toBe(true);
  expect(
    isGetLearningLessonResponse({
      ...lesson,
      variant: {
        ...variant,
        vocabulary: { ...variant.vocabulary, questions: [null] },
      },
    }),
  ).toBe(false);
  expect(
    isGetLearningLessonResponse({
      ...lesson,
      variant: {
        ...variant,
        vocabulary: {
          ...variant.vocabulary,
          words: [
            { ...variant.vocabulary.words[0], imageSourceUrl: 'relative/path' },
          ],
        },
      },
    }),
  ).toBe(false);
});

it('validates vocabulary feedback without coercing or stripping properties', () => {
  const feedback = {
    ...createVocabularyFeedback(0, 'word-2'),
    futureField: 'preserved',
  };
  expect(isCheckVocabularyAnswerResponse(feedback)).toBe(true);
  expect(feedback.futureField).toBe('preserved');
  const malformed = { ...feedback, isCorrect: 'false' };
  expect(isCheckVocabularyAnswerResponse(malformed)).toBe(false);
  expect(malformed.isCorrect).toBe('false');
});
