export type RegisterUserRequest = {
  email: string;
  password: string;
  passwordConfirmation: string;
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
  user: AuthUser;
};

export type LoginUserResponse = {
  user: AuthUser;
};
