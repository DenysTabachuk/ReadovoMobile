import { isErrorWithCode } from '@react-native-google-signin/google-signin';

export function isDeveloperError(error: unknown) {
  if (!isErrorWithCode(error)) {
    return false;
  }

  return error.code === 'DEVELOPER_ERROR' || error.code === '10';
}
