import {
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from '@/api/generated/transport';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await postAuthRequest<ResetPasswordResponse>(
    'reset-password',
    request,
  );

  return response.data;
}
