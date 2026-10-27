import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import { type GoogleLoginRequest, type GoogleLoginResponse } from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function loginWithGoogle(
  request: GoogleLoginRequest,
): Promise<GoogleLoginResponse> {
  const response = await postAuthRequest('google', request).catch(
    mapHttpError('auth.errors.default', {
      statuses: {
        [HTTP_STATUS.unauthorized]: 'auth.errors.googleSignInFailed',
      },
    }),
  );

  return response.data as GoogleLoginResponse;
}
