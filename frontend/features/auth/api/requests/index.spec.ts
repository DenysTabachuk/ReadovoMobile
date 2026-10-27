import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';

import {
  loginUser,
  loginWithGoogle,
  registerUser,
  requestPasswordReset,
  resendVerificationCode,
  resetPassword,
  verifyEmail,
  verifyPasswordResetCode,
} from '.';

const credentials = { email: 'reader@example.test', password: 'secret' };
const registration = { ...credentials, passwordConfirmation: 'secret' };
const email = { email: credentials.email };
const verification = { ...email, code: '123456' };
const reset = { ...registration, resetToken: 'reset-token' };
const google = { idToken: 'google-id-token' };

it.each([
  { path: 'login', run: () => loginUser(credentials), body: credentials },
  { path: 'google', run: () => loginWithGoogle(google), body: google },
  {
    path: 'register',
    run: () => registerUser(registration),
    body: registration,
  },
  {
    path: 'request-password-reset',
    run: () => requestPasswordReset(email),
    body: email,
  },
  {
    path: 'resend-verification-code',
    run: () => resendVerificationCode(email),
    body: email,
  },
  { path: 'reset-password', run: () => resetPassword(reset), body: reset },
  {
    path: 'verify-email',
    run: () => verifyEmail(verification),
    body: verification,
  },
  {
    path: 'verify-password-reset-code',
    run: () => verifyPasswordResetCode(verification),
    body: verification,
  },
])(
  'preserves the $path wire contract without session credentials',
  async ({ path, run, body }) => {
    const data = { email: credentials.email };
    const adapter = mockHttpAdapter().mockResolvedValue(
      createHttpResponse(data),
    );
    await expect(run()).resolves.toEqual(data);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      url: `https://api.example.test/auth/${path}`,
      method: 'post',
      data: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(adapter.mock.calls[0][0].headers.has('Authorization')).toBe(false);
  },
);

it.each([
  {
    status: 400,
    run: () => loginUser(credentials),
    error: 'auth.errors.invalidEmail',
  },
  {
    status: 401,
    run: () => loginUser(credentials),
    error: 'auth.errors.invalidCredentials',
  },
  {
    status: 409,
    run: () => registerUser(registration),
    error: 'auth.errors.emailAlreadyExists',
  },
  {
    status: 401,
    run: () => loginWithGoogle(google),
    error: 'auth.errors.googleSignInFailed',
  },
  {
    status: 400,
    run: () => resetPassword(reset),
    error: 'auth.errors.resetPasswordInvalidOrExpired',
  },
  {
    status: 400,
    run: () => verifyEmail(verification),
    error: 'auth.errors.invalidOrExpiredVerificationCode',
  },
  {
    status: 400,
    run: () => verifyPasswordResetCode(verification),
    error: 'auth.errors.invalidOrExpiredVerificationCode',
  },
  {
    status: 400,
    run: () => requestPasswordReset(email),
    error: 'auth.errors.invalidEmail',
  },
  {
    status: 400,
    run: () => resendVerificationCode(email),
    error: 'auth.errors.pendingRegistrationNotFound',
  },
])(
  'maps HTTP $status to $error even for HTML error bodies',
  async ({ status, run, error }) => {
    const adapter = mockHttpAdapter().mockResolvedValue(
      createHttpResponse('<html>Error</html>', { status }),
    );
    await expect(run()).rejects.toThrow(error);
    expect(adapter).toHaveBeenCalledTimes(1);
  },
);
