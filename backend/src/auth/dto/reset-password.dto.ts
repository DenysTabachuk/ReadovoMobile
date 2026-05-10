export type ResetPasswordDto = {
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  resetToken?: string;
};
