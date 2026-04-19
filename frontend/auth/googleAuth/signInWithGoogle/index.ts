import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { configureGoogleSignIn } from '../configureGoogleSignIn';
import { getGoogleSignInUserMessage } from '../utils/getGoogleSignInUserMessage';
import { logGoogleSignInError } from '../utils/logGoogleSignInError';

async function ensureGooglePlayServices() {
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
  } catch (error) {
    logGoogleSignInError('hasPlayServices', error);
    throw error;
  }
}

async function requestGoogleSignIn() {
  try {
    return await GoogleSignin.signIn();
  } catch (error) {
    logGoogleSignInError('signIn', error);
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    configureGoogleSignIn();
    await ensureGooglePlayServices();

    const response = await requestGoogleSignIn();

    if (!isSuccessResponse(response)) {
      console.log('[GoogleSignIn] signIn did not return a success response', response);
      return null;
    }

    const { user, idToken, serverAuthCode } = response.data;

    return {
      user,
      idToken,
      serverAuthCode,
    };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return null;
      }

      const userMessage = getGoogleSignInUserMessage(error);

      if (userMessage) {
        throw new Error(userMessage);
      }
    }

    throw error;
  }
}
