import {
  type LoginUserRequest,
  type AuthSessionResponse as LoginUserResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function loginUser(
  request: LoginUserRequest,
): Promise<LoginUserResponse> {
  const response = await postAuthRequest<LoginUserResponse>('login', request);

  return response.data;
}
