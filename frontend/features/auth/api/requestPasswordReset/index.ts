import { HTTP_STATUS } from '@/api';

import {
  type RequestPasswordResetRequest,
  type RequestPasswordResetResponse,
} from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function requestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  const response = await postAuthRequest('request-password-reset', request);

  if (response.status === HTTP_STATUS.badRequest) {
    throw new Error('auth.errors.invalidEmail');
  }

  if (!response.ok) {
    throw new Error('auth.errors.requestPasswordResetFailed');
  }

  return response.json() as Promise<RequestPasswordResetResponse>;
}
