import { type LoginUserRequest, type LoginUserResponse } from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function loginUser(
  request: LoginUserRequest,
): Promise<LoginUserResponse> {
  const response = await postAuthRequest('login', request);

  return response.data as LoginUserResponse;
}
