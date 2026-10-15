import { HTTP_STATUS } from '@/api';

import { type LoginUserRequest, type LoginUserResponse } from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function loginUser(
  request: LoginUserRequest,
): Promise<LoginUserResponse> {
  const response = await postAuthRequest('login', request);

  if (response.status === HTTP_STATUS.badRequest) {
    throw new Error('auth.errors.invalidEmail');
  }

  if (response.status === HTTP_STATUS.unauthorized) {
    throw new Error('auth.errors.invalidCredentials');
  }

  if (!response.ok) {
    throw new Error('auth.errors.loginFailed');
  }

  return response.json() as Promise<LoginUserResponse>;
}
