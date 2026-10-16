import { statusCodes } from '@react-native-google-signin/google-signin';

import { ANDROID_PACKAGE_NAME, DEBUG_SHA1 } from '../../constants';
import { isGoogleSignInConfigurationError } from '../isGoogleSignInConfigurationError';

/**
 * Map recognized Google sign-in errors to localized message keys.
 *
 * Logs Android OAuth configuration details when the code represents a developer error.
 *
 * @param error - Google sign-in error carrying a code.
 * @returns A translation key for known setup, progress, or Play Services errors, otherwise
 *   null.
 * @example
 * getGoogleSignInUserMessage({ code: 'UNKNOWN' });
 * // => null
 */
export function getGoogleSignInUserMessage(error: { code: string }) {
  if (error.code === statusCodes.IN_PROGRESS) {
    return 'auth.errors.googleSignInInProgress';
  }

  if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'auth.errors.googlePlayServicesUnavailable';
  }

  if (isGoogleSignInConfigurationError(error)) {
    console.error(
      `[GoogleSignIn] DEVELOPER_ERROR. Check Android OAuth client: package ${ANDROID_PACKAGE_NAME}, SHA-1 ${DEBUG_SHA1}.`,
    );
    return 'auth.errors.googleDeveloperError';
  }

  return null;
}
