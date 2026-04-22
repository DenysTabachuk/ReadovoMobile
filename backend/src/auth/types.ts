export type StoredUser = {
  createdAt: string;
  email: string;
  id: string;
  passwordHash: string;
  passwordSalt: string;
};

export type AuthUser = {
  createdAt: string;
  email: string;
  id: string;
};

export type RegisterUserResponse = {
  user: AuthUser;
};
