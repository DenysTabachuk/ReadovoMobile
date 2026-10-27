import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import {
  type ResendVerificationCodeRequest,
  type ResendVerificationCodeResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function resendVerificationCode(
  request: ResendVerificationCodeRequest,
): Promise<ResendVerificationCodeResponse> {
  const response = await postAuthRequest(
    'resend-verification-code',
    request,
  ).catch(
    mapHttpError('auth.errors.resendVerificationCodeFailed', {
      statuses: {
        [HTTP_STATUS.badRequest]: 'auth.errors.pendingRegistrationNotFound',
        [HTTP_STATUS.conflict]: 'auth.errors.emailAlreadyExists',
      },
    }),
  );

  return response.data as ResendVerificationCodeResponse;
}
