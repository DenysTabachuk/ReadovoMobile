import {
  type AuthEmailRequest as ResendVerificationCodeRequest,
  type VerificationCodeDeliveryResponse as ResendVerificationCodeResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function resendVerificationCode(
  request: ResendVerificationCodeRequest,
): Promise<ResendVerificationCodeResponse> {
  const response = await postAuthRequest<ResendVerificationCodeResponse>(
    'resend-verification-code',
    request,
  );

  return response.data;
}
