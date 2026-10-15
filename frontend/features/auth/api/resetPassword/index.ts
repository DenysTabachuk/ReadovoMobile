import { HTTP_STATUS } from '@/api';

import {
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await postAuthRequest('reset-password', request);

  if (response.status === HTTP_STATUS.badRequest) {
    throw new Error('auth.errors.resetPasswordInvalidOrExpired');
  }

  if (!response.ok) {
    throw new Error('auth.errors.resetPasswordFailed');
  }

  return response.json() as Promise<ResetPasswordResponse>;
}
