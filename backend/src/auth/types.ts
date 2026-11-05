import type {
  AuthSessionResponseDto,
  AuthUserResponseDto,
} from './dto/auth-session-response.dto';
import type { VerificationCodeDeliveryResponseDto } from './dto/verification-code-delivery-response.dto';

export type StoredUser = {
  balance: number;
  createdAt: string;
  email: string;
  id: string;
  lessonsCompleted: number;
  passwordHash: string;
  passwordSalt: string;
  testsCompleted: number;
  wordsLearned: number;
};

export type PendingUserRegistration = {
  createdAt: string;
  email: string;
  id: string;
  passwordHash: string;
  passwordSalt: string;
  verificationCodeHash: string;
  verificationCodeSalt: string;
  verificationExpiresAt: string;
};

export type PasswordResetRequest = {
  createdAt: string;
  email: string;
  id: string;
  resetTokenExpiresAt: string | null;
  resetTokenHash: string | null;
  resetTokenSalt: string | null;
  verificationCodeHash: string;
  verificationCodeSalt: string;
  verificationExpiresAt: string;
};

export type RefreshTokenRecord = {
  createdAt: string;
  expiresAt: string;
  id: string;
  revokedAt: string | null;
  tokenHash: string;
  tokenSalt: string;
  userId: string;
};

export type AuthUser = AuthUserResponseDto;

export type AuthenticatedUser = {
  email: string;
  id: string;
};

type AuthSession = AuthSessionResponseDto;
export type RegisterUserResponse = VerificationCodeDeliveryResponseDto;

export type LoginUserResponse = AuthSession;

export type VerifyEmailResponse = AuthSession;

export type ResendVerificationCodeResponse =
  VerificationCodeDeliveryResponseDto;
export type RequestPasswordResetResponse = VerificationCodeDeliveryResponseDto;
export type { VerifyPasswordResetCodeResponseDto as VerifyPasswordResetCodeResponse } from './dto/verify-password-reset-code-response.dto';
export type { ResetPasswordResponseDto as ResetPasswordResponse } from './dto/reset-password-response.dto';
