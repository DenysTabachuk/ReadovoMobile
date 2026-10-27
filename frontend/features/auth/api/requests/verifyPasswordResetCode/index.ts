import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import {
  type VerifyPasswordResetCodeRequest,
  type VerifyPasswordResetCodeResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function verifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  const response = await postAuthRequest(
    'verify-password-reset-code',
    request,
  ).catch(
    mapHttpError('auth.errors.verifyPasswordResetCodeFailed', {
      statuses: {
        [HTTP_STATUS.badRequest]:
          'auth.errors.invalidOrExpiredVerificationCode',
      },
    }),
  );

  return response.data as VerifyPasswordResetCodeResponse;
}
