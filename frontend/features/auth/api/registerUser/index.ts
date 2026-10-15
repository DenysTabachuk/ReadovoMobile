import { HTTP_STATUS } from '@/api';

import { type RegisterUserRequest, type RegisterUserResponse } from '../types';
import { postAuthRequest } from '../utils/postAuthRequest';

export async function registerUser(
  request: RegisterUserRequest,
): Promise<RegisterUserResponse> {
  const response = await postAuthRequest('register', request);

  if (response.status === HTTP_STATUS.conflict) {
    throw new Error('auth.errors.emailAlreadyExists');
  }

  if (!response.ok) {
    throw new Error('auth.errors.registrationFailed');
  }

  return response.json() as Promise<RegisterUserResponse>;
}
