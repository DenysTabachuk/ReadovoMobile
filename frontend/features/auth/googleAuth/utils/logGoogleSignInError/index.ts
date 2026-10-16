import { ANDROID_PACKAGE_NAME, DEBUG_SHA1 } from '../../constants';
import { getErrorDebugInfo } from '../getErrorDebugInfo';
import { isGoogleSignInConfigurationError } from '../isGoogleSignInConfigurationError';

/**
 * Write a failed Google sign-in stage and native diagnostic details to the console.
 *
 * This helper has logging side effects and does not rethrow or transform the original error.
 *
 * @param stage - Name of the failed sign-in operation.
 * @param error - Original thrown value.
 * @returns Nothing; writes diagnostics with console.error and adds configuration guidance
 *   for developer errors.
 * @example
 * logGoogleSignInError('signIn', 'cancelled');
 * // => undefined; logs the stage, raw error, and Android configuration
 */
export function logGoogleSignInError(stage: string, error: unknown) {
  console.error(`[GoogleSignIn] ${stage} failed`, {
    error: getErrorDebugInfo(error),
    config: {
      androidPackageName: ANDROID_PACKAGE_NAME,
      debugSha1: DEBUG_SHA1,
    },
  });

  if (isGoogleSignInConfigurationError(error)) {
    console.error(
      '[GoogleSignIn] DEVELOPER_ERROR usually means Google OAuth does not match this APK',
      {
        requiredAndroidOAuthClient: {
          packageName: ANDROID_PACKAGE_NAME,
          sha1: DEBUG_SHA1,
        },
        note: 'This app is configured without webClientId, so the Android OAuth client package/SHA-1 is the main thing to check.',
        nextStep:
          'Check Google Cloud/Firebase OAuth clients, then rebuild and reinstall the native app.',
      },
    );
  }
}
