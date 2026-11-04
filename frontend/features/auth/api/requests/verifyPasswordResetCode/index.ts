import {
  type VerifyAuthCodeRequest as VerifyPasswordResetCodeRequest,
  type VerifyPasswordResetCodeResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function verifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  const response = await postAuthRequest<VerifyPasswordResetCodeResponse>(
    'verify-password-reset-code',
    request,
  );

  return response.data;
}
