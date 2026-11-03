import {
  type AuthEmailRequest as RequestPasswordResetRequest,
  type VerificationCodeDeliveryResponse as RequestPasswordResetResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function requestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  const response = await postAuthRequest<RequestPasswordResetResponse>(
    'request-password-reset',
    request,
  );

  return response.data;
}
