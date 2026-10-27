import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import {
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await postAuthRequest('reset-password', request).catch(
    mapHttpError('auth.errors.resetPasswordFailed', {
      statuses: {
        [HTTP_STATUS.badRequest]: 'auth.errors.resetPasswordInvalidOrExpired',
      },
    }),
  );

  return response.data as ResetPasswordResponse;
}
