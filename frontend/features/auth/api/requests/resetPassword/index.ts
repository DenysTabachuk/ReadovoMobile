import {
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from '../../types';
import { postAuthRequest } from '../../utils/postAuthRequest';

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await postAuthRequest('reset-password', request);

  return response.data as ResetPasswordResponse;
}
