import { HttpError } from '@/api/httpError';
import { getVocabularyErrorMessageKey } from '.';

it('maps only the documented lesson 404 and hides diagnostics', () => {
  expect(
    getVocabularyErrorMessageKey(
      new HttpError({
        status: 404,
        data: { code: 'VOCABULARY_LESSON_NOT_FOUND' },
      }),
    ),
  ).toBe('vocabulary.notFound');
  expect(
    getVocabularyErrorMessageKey(
      new HttpError({
        status: 500,
        data: { code: 'VOCABULARY_LESSON_NOT_FOUND' },
      }),
    ),
  ).toBe('vocabulary.loadError');
  expect(getVocabularyErrorMessageKey(new Error('private diagnostic'))).toBe(
    'vocabulary.loadError',
  );
  const cancelled = new Error('cancelled');
  cancelled.name = 'AbortError';
  expect(getVocabularyErrorMessageKey(cancelled)).toBeNull();
});
