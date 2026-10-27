import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import {
  type RequestPasswordResetRequest,
  type RequestPasswordResetResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function requestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  const response = await postAuthRequest(
    'request-password-reset',
    request,
  ).catch(
    mapHttpError('auth.errors.requestPasswordResetFailed', {
      statuses: { [HTTP_STATUS.badRequest]: 'auth.errors.invalidEmail' },
    }),
  );

  return response.data as RequestPasswordResetResponse;
}
