import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

const ERROR_MESSAGES = new Map([
  [
    'DICTIONARY_WORD_ALREADY_EXISTS',
    { status: 400, messageKey: 'dictionary.alreadyExists' },
  ],
  [
    'DICTIONARY_WORD_TOO_LONG',
    { status: 400, messageKey: 'dictionary.tooManyWords' },
  ],
  [
    'DICTIONARY_WORD_NOT_FOUND',
    { status: 404, messageKey: 'dictionary.wordNotFound' },
  ],
  [
    'DICTIONARY_TEST_NO_WORDS',
    { status: 400, messageKey: 'dictionary.test.noWords' },
  ],
  [
    'DICTIONARY_TEST_NO_REVIEW_CANDIDATES',
    { status: 400, messageKey: 'dictionary.test.noReviewCandidates' },
  ],
]);
/**
 * Selects localized dictionary feedback from explicit API codes.
 * @param error - Request failure; backend message text is ignored.
 * @param fallbackKey - Optional override; unknown failures default to errors.generic.
 * @returns A translation key, or null for cancellation. Status mismatches fall back.
 * @example
 * getDictionaryErrorMessageKey(new Error('private diagnostics')); // => 'errors.generic'
 */
export function getDictionaryErrorMessageKey(
  error: unknown,
  fallbackKey?: string,
): string | null {
  return getApiErrorMessageKey(error, { fallbackKey, codes: ERROR_MESSAGES });
}
