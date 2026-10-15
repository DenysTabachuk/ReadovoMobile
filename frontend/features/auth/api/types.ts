export type RegisterUserRequest = {
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type VerifyEmailRequest = {
  code: string;
  email: string;
};

export type ResendVerificationCodeRequest = {
  email: string;
};

export type LoginUserRequest = {
  email: string;
  password: string;
};

export type GoogleLoginRequest = {
  idToken: string;
};

export type RequestPasswordResetRequest = {
  email: string;
};

export type VerifyPasswordResetCodeRequest = {
  code: string;
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  password: string;
  passwordConfirmation: string;
  resetToken: string;
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

export type RegisterUserResponse = {
  email: string;
  verificationExpiresAt: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
};

export type LoginUserResponse = AuthSessionResponse;

export type GoogleLoginResponse = AuthSessionResponse;

export type VerifyEmailResponse = AuthSessionResponse;

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
