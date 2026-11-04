import {
  type GoogleLoginRequest,
  type AuthSessionResponse as GoogleLoginResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function loginWithGoogle(
  request: GoogleLoginRequest,
): Promise<GoogleLoginResponse> {
  const response = await postAuthRequest<GoogleLoginResponse>(
    'google',
    request,
  );

  return response.data;
}
