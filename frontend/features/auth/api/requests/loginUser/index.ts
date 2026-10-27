import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import { type LoginUserRequest, type LoginUserResponse } from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function loginUser(
  request: LoginUserRequest,
): Promise<LoginUserResponse> {
  const response = await postAuthRequest('login', request).catch(
    mapHttpError('auth.errors.loginFailed', {
      statuses: {
        [HTTP_STATUS.badRequest]: 'auth.errors.invalidEmail',
        [HTTP_STATUS.unauthorized]: 'auth.errors.invalidCredentials',
      },
    }),
  );

  return response.data as LoginUserResponse;
}
