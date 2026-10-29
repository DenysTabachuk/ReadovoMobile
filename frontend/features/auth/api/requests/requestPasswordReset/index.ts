import {
  type RequestPasswordResetRequest,
  type RequestPasswordResetResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function requestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  const response = await postAuthRequest('request-password-reset', request);

  return response.data as RequestPasswordResetResponse;
}
