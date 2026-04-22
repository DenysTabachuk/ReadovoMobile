import { API_BASE_URL } from './constants';
import { type RegisterUserRequest, type RegisterUserResponse } from './types';

export type { AuthUser, RegisterUserRequest, RegisterUserResponse } from './types';

export async function registerUser(
  request: RegisterUserRequest
): Promise<RegisterUserResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 409) {
    throw new Error('auth.errors.emailAlreadyExists');
  }

  if (!response.ok) {
    throw new Error('auth.errors.registrationFailed');
  }

  return response.json() as Promise<RegisterUserResponse>;
}
