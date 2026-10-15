import { HTTP_STATUS } from '@/api';

import { type VerifyEmailRequest, type VerifyEmailResponse } from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function verifyEmail(
  request: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  const response = await postAuthRequest('verify-email', request);

  if (response.status === HTTP_STATUS.badRequest) {
    throw new Error('auth.errors.invalidOrExpiredVerificationCode');
  }

  if (response.status === HTTP_STATUS.conflict) {
    throw new Error('auth.errors.emailAlreadyExists');
  }

  if (!response.ok) {
    throw new Error('auth.errors.emailVerificationFailed');
  }

  return response.json() as Promise<VerifyEmailResponse>;
}
