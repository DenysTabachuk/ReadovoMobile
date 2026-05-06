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
