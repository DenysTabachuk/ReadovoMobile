import { HttpError } from '@/api/httpError';
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
  { status: 400, run: () => loginUser(credentials), code: 'VALIDATION_FAILED' },
  {
    status: 401,
    run: () => loginUser(credentials),
    code: 'AUTH_CREDENTIALS_INVALID',
  },
  {
    status: 409,
    run: () => registerUser(registration),
    code: 'AUTH_EMAIL_ALREADY_EXISTS',
  },
  {
    status: 401,
    run: () => loginWithGoogle(google),
    code: 'AUTH_GOOGLE_IDENTITY_REJECTED',
  },
  {
    status: 400,
    run: () => resetPassword(reset),
    code: 'AUTH_RESET_REQUEST_INVALID',
  },
  {
    status: 400,
    run: () => verifyEmail(verification),
    code: 'AUTH_VERIFICATION_CODE_INVALID',
  },
  {
    status: 400,
    run: () => verifyPasswordResetCode(verification),
    code: 'AUTH_RESET_CODE_INVALID',
  },
  {
    status: 400,
    run: () => requestPasswordReset(email),
    code: 'VALIDATION_FAILED',
  },
  {
    status: 400,
    run: () => resendVerificationCode(email),
    code: 'AUTH_REGISTRATION_NOT_PENDING',
  },
])(
  'preserves HTTP $status/$code for presentation',
  async ({ status, run, code }) => {
    const adapter = mockHttpAdapter().mockResolvedValue(
      createHttpResponse(
        { code, message: 'Changed backend wording' },
        { status },
      ),
    );
    const pending = run();
    await expect(pending).rejects.toBeInstanceOf(HttpError);
    await expect(pending).rejects.toMatchObject({ status, code });
    expect(adapter).toHaveBeenCalledTimes(1);
  },
);
it('does not infer an auth code from a status or HTML body', async () => {
  mockHttpAdapter().mockResolvedValue(
    createHttpResponse('<html>Error</html>', { status: 401 }),
  );
  await expect(loginUser(credentials)).rejects.toMatchObject({
    status: 401,
    code: undefined,
  });
});
