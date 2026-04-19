import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_SIGN_IN_CONFIG } from '../constants';

export function configureGoogleSignIn() {
  GoogleSignin.configure(GOOGLE_SIGN_IN_CONFIG);
}
