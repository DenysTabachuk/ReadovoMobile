import { HTTP_STATUS } from '@/api';

import {
  type ResendVerificationCodeRequest,
  type ResendVerificationCodeResponse,
} from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function resendVerificationCode(
  request: ResendVerificationCodeRequest,
): Promise<ResendVerificationCodeResponse> {
  const response = await postAuthRequest('resend-verification-code', request);

  if (response.status === HTTP_STATUS.badRequest) {
    throw new Error('auth.errors.pendingRegistrationNotFound');
  }

  if (response.status === HTTP_STATUS.conflict) {
    throw new Error('auth.errors.emailAlreadyExists');
  }

  if (!response.ok) {
    throw new Error('auth.errors.resendVerificationCodeFailed');
  }

  return response.json() as Promise<ResendVerificationCodeResponse>;
}
