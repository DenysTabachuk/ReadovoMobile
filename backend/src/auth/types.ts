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
  user: AuthUser;
};

export type LoginUserResponse = {
  user: AuthUser;
};
