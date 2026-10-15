import { HTTP_STATUS } from '@/api';

import { type GoogleLoginRequest, type GoogleLoginResponse } from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function loginWithGoogle(
  request: GoogleLoginRequest,
): Promise<GoogleLoginResponse> {
  const response = await postAuthRequest('google', request);

  if (response.status === HTTP_STATUS.unauthorized) {
    throw new Error('auth.errors.googleSignInFailed');
  }

  if (!response.ok) {
    throw new Error('auth.errors.default');
  }

  return response.json() as Promise<GoogleLoginResponse>;
}
