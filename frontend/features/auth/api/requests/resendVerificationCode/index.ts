import {
  type ResendVerificationCodeRequest,
  type ResendVerificationCodeResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function resendVerificationCode(
  request: ResendVerificationCodeRequest,
): Promise<ResendVerificationCodeResponse> {
  const response = await postAuthRequest('resend-verification-code', request);

  return response.data as ResendVerificationCodeResponse;
}
