import { statusCodes } from '@react-native-google-signin/google-signin';

import { ANDROID_PACKAGE_NAME, DEBUG_SHA1 } from '../../constants';
import { isDeveloperError } from '../isDeveloperError';

export function getGoogleSignInUserMessage(error: { code: string }) {
  if (error.code === statusCodes.IN_PROGRESS) {
    return 'auth.errors.googleSignInInProgress';
  }

  if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'auth.errors.googlePlayServicesUnavailable';
  }

  if (isDeveloperError(error)) {
    console.error(
      `[GoogleSignIn] DEVELOPER_ERROR. Check Android OAuth client: package ${ANDROID_PACKAGE_NAME}, SHA-1 ${DEBUG_SHA1}.`,
    );
    return 'auth.errors.googleDeveloperError';
  }

  return null;
}
