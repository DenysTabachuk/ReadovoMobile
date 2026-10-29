import { HttpError } from '../../httpError';
import { getApiErrorMessageKey } from '.';
import en from '@/localization/en/translation.json';
import uk from '@/localization/uk/translation.json';

const options = {
  fallbackKey: 'dictionary.saveError',
  codes: new Map([
    [
      'DICTIONARY_WORD_ALREADY_EXISTS',
      { status: 400, messageKey: 'dictionary.alreadyExists' },
    ],
  ]),
};

it.each([
  new Error('private details'),
  new HttpError({ status: 500, data: { code: 'INTERNAL_ERROR' } }),
  new HttpError({ status: 400, data: { code: 'FUTURE_CODE' } }),
  undefined,
])('uses generic feedback when no override is provided %#', (error) => {
  expect(getApiErrorMessageKey(error)).toBe('errors.generic');
  expect(getApiErrorMessageKey(error, {})).toBe('errors.generic');
  expect(getApiErrorMessageKey(error, { codes: options.codes })).toBe(
    'errors.generic',
  );
});

it('provides generic feedback in both supported languages', () => {
  expect(en.errors.generic).toBe(
    'Something went wrong. Please try again later.',
  );
  expect(uk.errors.generic).toBe('Щось пішло не так. Спробуйте пізніше.');
});

it('uses code and status independently of backend message wording', () => {
  expect(
    getApiErrorMessageKey(
      new HttpError({
        status: 400,
        data: {
          code: 'DICTIONARY_WORD_ALREADY_EXISTS',
          message: 'Changed wording',
        },
      }),
      options,
    ),
  ).toBe('dictionary.alreadyExists');
});
it.each([
  new HttpError({
    status: 409,
    data: { code: 'DICTIONARY_WORD_ALREADY_EXISTS' },
  }),
  new HttpError({
    status: 400,
    data: { code: 'FUTURE_CODE', message: 'dictionary.alreadyExists' },
  }),
  new HttpError({
    status: 400,
    data: { message: 'Word or phrase already exists in dictionary.' },
  }),
  new Error('dictionary.alreadyExists'),
  null,
])('uses an operation fallback for unrecognized failure %#', (error) => {
  expect(getApiErrorMessageKey(error, options)).toBe('dictionary.saveError');
});
it.each([
  ['AbortError', null],
  ['NetworkError', 'errors.network'],
  ['TimeoutError', 'errors.timeout'],
] as const)('handles transport category %s', (name, expected) => {
  expect(
    getApiErrorMessageKey(
      Object.assign(new Error('private'), { name }),
      options,
    ),
  ).toBe(expected);
});
it.each([
  [400, 'VALIDATION_FAILED', 'errors.invalidRequest'],
  [400, 'REQUEST_MALFORMED', 'errors.invalidRequest'],
  [403, 'AUTH_OWNERSHIP_DENIED', 'errors.forbidden'],
  [413, 'REQUEST_TOO_LARGE', 'errors.requestTooLarge'],
] as const)('handles shared HTTP %s/%s', (status, code, expected) => {
  expect(
    getApiErrorMessageKey(new HttpError({ status, data: { code } }), options),
  ).toBe(expected);
});
