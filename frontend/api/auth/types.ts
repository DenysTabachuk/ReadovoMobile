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

export type LoginUserResponse = {
  user: AuthUser;
};

export type VerifyEmailResponse = {
  user: AuthUser;
};

export type ResendVerificationCodeResponse = {
  email: string;
  verificationExpiresAt: string;
};
