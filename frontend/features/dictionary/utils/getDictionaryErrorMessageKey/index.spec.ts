import { HttpError } from '@/api/httpError';
import en from '@/localization/en/translation.json';
import uk from '@/localization/uk/translation.json';
import { getDictionaryErrorMessageKey } from '.';

it.each([
  [400, 'DICTIONARY_WORD_ALREADY_EXISTS', 'dictionary.alreadyExists'],
  [400, 'DICTIONARY_WORD_TOO_LONG', 'dictionary.tooManyWords'],
  [404, 'DICTIONARY_WORD_NOT_FOUND', 'dictionary.wordNotFound'],
  [400, 'DICTIONARY_TEST_NO_WORDS', 'dictionary.test.noWords'],
  [
    400,
    'DICTIONARY_TEST_NO_REVIEW_CANDIDATES',
    'dictionary.test.noReviewCandidates',
  ],
] as const)(
  'maps %s/%s without relying on message text',
  (status, code, key) => {
    expect(
      getDictionaryErrorMessageKey(
        new HttpError({
          status,
          data: { code, message: 'Changed backend wording' },
        }),
      ),
    ).toBe(key);
    expect(
      getDictionaryErrorMessageKey(
        new HttpError({ status: 599, data: { code } }),
      ),
    ).toBe('errors.generic');
    for (const locale of [en, uk]) {
      let value: unknown = locale;
      for (const segment of key.split('.')) {
        if (typeof value !== 'object' || value === null || !(segment in value))
          throw new Error('Missing translation: ' + key);
        value = Reflect.get(value, segment);
      }
      expect(typeof value).toBe('string');
    }
  },
);
it('ignores legacy messages and preserves silent cancellation', () => {
  expect(
    getDictionaryErrorMessageKey(
      new HttpError({ status: 400, data: { message: 'Not enough coins.' } }),
    ),
  ).toBe('errors.generic');
  expect(
    getDictionaryErrorMessageKey(new Error('auth.errors.invalidCredentials')),
  ).toBe('errors.generic');
  expect(
    getDictionaryErrorMessageKey(
      Object.assign(new Error(), { name: 'AbortError' }),
    ),
  ).toBeNull();
});
