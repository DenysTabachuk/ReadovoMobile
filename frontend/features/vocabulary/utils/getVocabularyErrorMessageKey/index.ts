import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

const ERROR_MESSAGES = new Map([
  [
    'VOCABULARY_PRACTICE_NOT_FOUND',
    { status: 404, messageKey: 'vocabulary.notFound' },
  ],
  [
    'VOCABULARY_LESSON_NOT_FOUND',
    { status: 404, messageKey: 'vocabulary.notFound' },
  ],
]);

/**
 * Selects safe vocabulary feedback from HTTP status/code pairs.
 * @param error - Request or decoding error; server messages are never displayed.
 * @returns A translation key, or null for cancellation. Unknown failures use the content loading error.
 * @example
 * getVocabularyErrorMessageKey(new Error('private details')); // => 'vocabulary.loadError'
 */
export function getVocabularyErrorMessageKey(error: unknown): string | null {
  return getApiErrorMessageKey(error, {
    fallbackKey: 'vocabulary.loadError',
    codes: ERROR_MESSAGES,
  });
}
