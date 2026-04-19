import { ANDROID_PACKAGE_NAME, DEBUG_SHA1 } from '../../constants';
import { getErrorDebugInfo } from '../getErrorDebugInfo';
import { isDeveloperError } from '../isDeveloperError';

export function logGoogleSignInError(stage: string, error: unknown) {
  console.error(`[GoogleSignIn] ${stage} failed`, {
    error: getErrorDebugInfo(error),
    config: {
      androidPackageName: ANDROID_PACKAGE_NAME,
      debugSha1: DEBUG_SHA1,
    },
  });

  if (isDeveloperError(error)) {
    console.error('[GoogleSignIn] DEVELOPER_ERROR usually means Google OAuth does not match this APK', {
      requiredAndroidOAuthClient: {
        packageName: ANDROID_PACKAGE_NAME,
        sha1: DEBUG_SHA1,
      },
      note: 'This app is configured without webClientId, so the Android OAuth client package/SHA-1 is the main thing to check.',
      nextStep: 'Check Google Cloud/Firebase OAuth clients, then rebuild and reinstall the native app.',
    });
  }
}
