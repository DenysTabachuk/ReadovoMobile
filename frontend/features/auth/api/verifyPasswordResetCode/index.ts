import { HTTP_STATUS } from '@/api';

import {
  type VerifyPasswordResetCodeRequest,
  type VerifyPasswordResetCodeResponse,
} from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function verifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  const response = await postAuthRequest('verify-password-reset-code', request);

  if (response.status === HTTP_STATUS.badRequest) {
    throw new Error('auth.errors.invalidOrExpiredVerificationCode');
  }

  if (!response.ok) {
    throw new Error('auth.errors.verifyPasswordResetCodeFailed');
  }

  return response.json() as Promise<VerifyPasswordResetCodeResponse>;
}
