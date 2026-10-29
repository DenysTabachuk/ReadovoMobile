import { HttpError } from '@/api/httpError';
import { GoogleSignInError } from '../../googleAuth/googleSignInError';
import en from '@/localization/en/translation.json';
import uk from '@/localization/uk/translation.json';
import { getAuthErrorMessageKey } from '.';

it.each([
  [401, 'AUTH_CREDENTIALS_INVALID', 'auth.errors.invalidCredentials'],
  [409, 'AUTH_EMAIL_ALREADY_EXISTS', 'auth.errors.emailAlreadyExists'],
  [
    400,
    'AUTH_REGISTRATION_NOT_PENDING',
    'auth.errors.pendingRegistrationNotFound',
  ],
  [
    400,
    'AUTH_VERIFICATION_CODE_INVALID',
    'auth.errors.verificationCodeInvalid',
  ],
  [
    400,
    'AUTH_VERIFICATION_CODE_EXPIRED',
    'auth.errors.verificationCodeExpired',
  ],
  [401, 'AUTH_GOOGLE_IDENTITY_REJECTED', 'auth.errors.googleSignInFailed'],
  [401, 'AUTH_REFRESH_REJECTED', 'auth.errors.sessionExpired'],
  [400, 'AUTH_RESET_CODE_INVALID', 'auth.errors.passwordResetCodeInvalid'],
  [400, 'AUTH_RESET_CODE_EXPIRED', 'auth.errors.passwordResetCodeExpired'],
  [
    400,
    'AUTH_RESET_REQUEST_INVALID',
    'auth.errors.resetPasswordInvalidOrExpired',
  ],
  [
    400,
    'AUTH_RESET_REQUEST_EXPIRED',
    'auth.errors.resetPasswordInvalidOrExpired',
  ],
  [401, 'AUTH_AUTHENTICATION_REQUIRED', 'auth.errors.sessionExpired'],
  [401, 'AUTH_ACCESS_TOKEN_INVALID', 'auth.errors.sessionExpired'],
  [401, 'AUTH_ACCESS_TOKEN_EXPIRED', 'auth.errors.sessionExpired'],
] as const)(
  'maps %s/%s without relying on message text',
  (status, code, key) => {
    expect(
      getAuthErrorMessageKey(
        new HttpError({
          status,
          data: { code, message: 'Changed backend wording' },
        }),
      ),
    ).toBe(key);
    expect(
      getAuthErrorMessageKey(new HttpError({ status: 599, data: { code } })),
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
    getAuthErrorMessageKey(
      new HttpError({ status: 400, data: { message: 'Not enough coins.' } }),
    ),
  ).toBe('errors.generic');
  expect(
    getAuthErrorMessageKey(new Error('auth.errors.invalidCredentials')),
  ).toBe('errors.generic');
  expect(
    getAuthErrorMessageKey(Object.assign(new Error(), { name: 'AbortError' })),
  ).toBeNull();
});
it('keeps native Google SDK feedback separate from backend messages', () => {
  expect(
    getAuthErrorMessageKey(
      new GoogleSignInError('auth.errors.googleDeveloperError'),
    ),
  ).toBe('auth.errors.googleDeveloperError');
});
