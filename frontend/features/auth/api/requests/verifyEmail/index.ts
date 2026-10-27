import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import { type VerifyEmailRequest, type VerifyEmailResponse } from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function verifyEmail(
  request: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  const response = await postAuthRequest('verify-email', request).catch(
    mapHttpError('auth.errors.emailVerificationFailed', {
      statuses: {
        [HTTP_STATUS.badRequest]:
          'auth.errors.invalidOrExpiredVerificationCode',
        [HTTP_STATUS.conflict]: 'auth.errors.emailAlreadyExists',
      },
    }),
  );

  return response.data as VerifyEmailResponse;
}
