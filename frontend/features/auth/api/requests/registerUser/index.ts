import { mapHttpError } from '@/api/utils/mapHttpError';
import { HTTP_STATUS } from '@/api';

import {
  type RegisterUserRequest,
  type RegisterUserResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function registerUser(
  request: RegisterUserRequest,
): Promise<RegisterUserResponse> {
  const response = await postAuthRequest('register', request).catch(
    mapHttpError('auth.errors.registrationFailed', {
      statuses: { [HTTP_STATUS.conflict]: 'auth.errors.emailAlreadyExists' },
    }),
  );

  return response.data as RegisterUserResponse;
}
