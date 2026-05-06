import { API_BASE_URL } from './constants';
import {
  type LoginUserRequest,
  type LoginUserResponse,
  type RegisterUserRequest,
  type RegisterUserResponse,
  type ResendVerificationCodeRequest,
  type ResendVerificationCodeResponse,
  type VerifyEmailRequest,
  type VerifyEmailResponse,
} from './types';

export type {
  AuthUser,
  LoginUserRequest,
  LoginUserResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  ResendVerificationCodeRequest,
  ResendVerificationCodeResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from './types';

export async function loginUser(
  request: LoginUserRequest,
): Promise<LoginUserResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 400) {
    throw new Error('auth.errors.invalidEmail');
  }

  if (response.status === 401) {
    throw new Error('auth.errors.invalidCredentials');
  }

  if (!response.ok) {
    throw new Error('auth.errors.loginFailed');
  }

  return response.json() as Promise<LoginUserResponse>;
}

export async function registerUser(
  request: RegisterUserRequest,
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

export async function verifyEmail(
  request: VerifyEmailRequest,
): Promise<VerifyEmailResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 400) {
    throw new Error('auth.errors.invalidOrExpiredVerificationCode');
  }

  if (response.status === 409) {
    throw new Error('auth.errors.emailAlreadyExists');
  }

  if (!response.ok) {
    throw new Error('auth.errors.emailVerificationFailed');
  }

  return response.json() as Promise<VerifyEmailResponse>;
}

export async function resendVerificationCode(
  request: ResendVerificationCodeRequest,
): Promise<ResendVerificationCodeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/resend-verification-code`,
    {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (response.status === 400) {
    throw new Error('auth.errors.pendingRegistrationNotFound');
  }

  if (response.status === 409) {
    throw new Error('auth.errors.emailAlreadyExists');
  }

  if (!response.ok) {
    throw new Error('auth.errors.resendVerificationCodeFailed');
  }

  return response.json() as Promise<ResendVerificationCodeResponse>;
}
