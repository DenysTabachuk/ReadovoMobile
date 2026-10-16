import { isErrorWithCode } from '@react-native-google-signin/google-signin';

/**
 * Recognize Google sign-in errors caused by native OAuth configuration.
 *
 * @param error - Any thrown value to inspect.
 * @returns True for an error with code DEVELOPER_ERROR or 10; false for other values.
 * @example
 * isGoogleSignInConfigurationError({ code: '10' });
 * // => true
 */
export function isGoogleSignInConfigurationError(error: unknown) {
  if (!isErrorWithCode(error)) {
    return false;
  }

  return error.code === 'DEVELOPER_ERROR' || error.code === '10';
}
