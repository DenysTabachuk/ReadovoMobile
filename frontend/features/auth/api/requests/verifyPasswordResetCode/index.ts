import {
  type VerifyPasswordResetCodeRequest,
  type VerifyPasswordResetCodeResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function verifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  const response = await postAuthRequest('verify-password-reset-code', request);

  return response.data as VerifyPasswordResetCodeResponse;
}
