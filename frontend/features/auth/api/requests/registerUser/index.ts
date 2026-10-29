import {
  type RegisterUserRequest,
  type RegisterUserResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function registerUser(
  request: RegisterUserRequest,
): Promise<RegisterUserResponse> {
  const response = await postAuthRequest('register', request);

  return response.data as RegisterUserResponse;
}
