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

export type AuthUser = {
  balance: number;
  createdAt: string;
  email: string;
  id: string;
  lessonsCompleted: number;
  testsCompleted: number;
  wordsLearned: number;
};

export type AuthenticatedUser = {
  email: string;
  id: string;
};

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
};

export type RegisterUserResponse = {
  email: string;
  verificationExpiresAt: string;
};

export type LoginUserResponse = AuthSession;

export type VerifyEmailResponse = AuthSession;

export type ResendVerificationCodeResponse = {
  email: string;
  verificationExpiresAt: string;
};

export type RequestPasswordResetResponse = {
  email: string;
  verificationExpiresAt: string;
};

export type VerifyPasswordResetCodeResponse = {
  email: string;
  resetToken: string;
};

export type ResetPasswordResponse = {
  email: string;
};
