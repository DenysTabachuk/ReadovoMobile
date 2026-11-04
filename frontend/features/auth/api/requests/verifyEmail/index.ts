import {
  type VerifyAuthCodeRequest as VerifyEmailRequest,
  type AuthSessionResponse as VerifyEmailResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function verifyEmail(
  request: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  const response = await postAuthRequest<VerifyEmailResponse>(
    'verify-email',
    request,
  );

  return response.data;
}
