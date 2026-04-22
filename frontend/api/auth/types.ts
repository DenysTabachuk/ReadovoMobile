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
  createdAt: string;
  email: string;
  id: string;
};

export type RegisterUserResponse = {
  user: AuthUser;
};

export type LoginUserResponse = {
  user: AuthUser;
};
