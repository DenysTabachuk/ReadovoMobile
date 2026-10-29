import { type GoogleLoginRequest, type GoogleLoginResponse } from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function loginWithGoogle(
  request: GoogleLoginRequest,
): Promise<GoogleLoginResponse> {
  const response = await postAuthRequest('google', request);

  return response.data as GoogleLoginResponse;
}
