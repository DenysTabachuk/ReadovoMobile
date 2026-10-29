import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';
import { GoogleSignInError } from '../../googleAuth/googleSignInError';

const ERROR_MESSAGES = new Map([
  [
    'AUTH_CREDENTIALS_INVALID',
    { status: 401, messageKey: 'auth.errors.invalidCredentials' },
  ],
  [
    'AUTH_EMAIL_ALREADY_EXISTS',
    { status: 409, messageKey: 'auth.errors.emailAlreadyExists' },
  ],
  [
    'AUTH_REGISTRATION_NOT_PENDING',
    { status: 400, messageKey: 'auth.errors.pendingRegistrationNotFound' },
  ],
  [
    'AUTH_VERIFICATION_CODE_INVALID',
    { status: 400, messageKey: 'auth.errors.verificationCodeInvalid' },
  ],
  [
    'AUTH_VERIFICATION_CODE_EXPIRED',
    { status: 400, messageKey: 'auth.errors.verificationCodeExpired' },
  ],
  [
    'AUTH_GOOGLE_IDENTITY_REJECTED',
    { status: 401, messageKey: 'auth.errors.googleSignInFailed' },
  ],
  [
    'AUTH_REFRESH_REJECTED',
    { status: 401, messageKey: 'auth.errors.sessionExpired' },
  ],
  [
    'AUTH_RESET_CODE_INVALID',
    { status: 400, messageKey: 'auth.errors.passwordResetCodeInvalid' },
  ],
  [
    'AUTH_RESET_CODE_EXPIRED',
    { status: 400, messageKey: 'auth.errors.passwordResetCodeExpired' },
  ],
  [
    'AUTH_RESET_REQUEST_INVALID',
    { status: 400, messageKey: 'auth.errors.resetPasswordInvalidOrExpired' },
  ],
  [
    'AUTH_RESET_REQUEST_EXPIRED',
    { status: 400, messageKey: 'auth.errors.resetPasswordInvalidOrExpired' },
  ],
  [
    'AUTH_AUTHENTICATION_REQUIRED',
    { status: 401, messageKey: 'auth.errors.sessionExpired' },
  ],
  [
    'AUTH_ACCESS_TOKEN_INVALID',
    { status: 401, messageKey: 'auth.errors.sessionExpired' },
  ],
  [
    'AUTH_ACCESS_TOKEN_EXPIRED',
    { status: 401, messageKey: 'auth.errors.sessionExpired' },
  ],
]);
/**
 * Selects localized auth feedback from explicit API codes.
 * @param error - Request failure; backend message text is ignored.
 * @param fallbackKey - Optional override; unknown failures default to errors.generic.
 * @returns A translation key, or null for cancellation. Status mismatches fall back.
 * @example
 * getAuthErrorMessageKey(new Error('private diagnostics')); // => 'errors.generic'
 */
export function getAuthErrorMessageKey(
  error: unknown,
  fallbackKey?: string,
): string | null {
  if (error instanceof GoogleSignInError) return error.messageKey;
  return getApiErrorMessageKey(error, { fallbackKey, codes: ERROR_MESSAGES });
}
