import { API_BASE_URL } from './constants';
import {
  type LoginUserRequest,
  type LoginUserResponse,
  type GoogleLoginRequest,
  type GoogleLoginResponse,
  type RegisterUserRequest,
  type RegisterUserResponse,
  type RequestPasswordResetRequest,
  type RequestPasswordResetResponse,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
  type ResendVerificationCodeRequest,
  type ResendVerificationCodeResponse,
  type VerifyPasswordResetCodeRequest,
  type VerifyPasswordResetCodeResponse,
  type VerifyEmailRequest,
  type VerifyEmailResponse,
} from './types';

export type {
  AuthUser,
  GoogleLoginRequest,
  GoogleLoginResponse,
  LoginUserRequest,
  LoginUserResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResendVerificationCodeRequest,
  ResendVerificationCodeResponse,
  VerifyPasswordResetCodeRequest,
  VerifyPasswordResetCodeResponse,
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

export async function loginWithGoogle(
  request: GoogleLoginRequest,
): Promise<GoogleLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 401) {
    throw new Error('auth.errors.googleSignInFailed');
  }

  if (!response.ok) {
    throw new Error('auth.errors.default');
  }

  return response.json() as Promise<GoogleLoginResponse>;
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

export async function requestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 400) {
    throw new Error('auth.errors.invalidEmail');
  }

  if (!response.ok) {
    throw new Error('auth.errors.requestPasswordResetFailed');
  }

  return response.json() as Promise<RequestPasswordResetResponse>;
}

export async function verifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-password-reset-code`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 400) {
    throw new Error('auth.errors.invalidOrExpiredVerificationCode');
  }

  if (!response.ok) {
    throw new Error('auth.errors.verifyPasswordResetCodeFailed');
  }

  return response.json() as Promise<VerifyPasswordResetCodeResponse>;
}

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 400) {
    throw new Error('auth.errors.resetPasswordInvalidOrExpired');
  }

  if (!response.ok) {
    throw new Error('auth.errors.resetPasswordFailed');
  }

  return response.json() as Promise<ResetPasswordResponse>;
}
