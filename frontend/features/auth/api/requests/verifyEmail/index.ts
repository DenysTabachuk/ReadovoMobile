import { type VerifyEmailRequest, type VerifyEmailResponse } from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function verifyEmail(
  request: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  const response = await postAuthRequest('verify-email', request);

  return response.data as VerifyEmailResponse;
}
