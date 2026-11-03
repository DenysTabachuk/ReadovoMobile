import {
  type RegisterUserRequest,
  type VerificationCodeDeliveryResponse as RegisterUserResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function registerUser(
  request: RegisterUserRequest,
): Promise<RegisterUserResponse> {
  const response = await postAuthRequest<RegisterUserResponse>(
    'register',
    request,
  );

  return response.data;
}
