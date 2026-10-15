import { GoogleSignin } from '@react-native-google-signin/google-signin';

export async function signOutFromGoogle() {
  await GoogleSignin.signOut();
}
