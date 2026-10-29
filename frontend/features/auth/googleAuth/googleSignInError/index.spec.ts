import { GoogleSignInError } from '.';

it('keeps the presentation key separate from the diagnostic message', () => {
  const error = new GoogleSignInError('auth.errors.googleSignInInProgress');
  expect(error.messageKey).toBe('auth.errors.googleSignInInProgress');
  expect(error.message).toBe('Google sign-in failed.');
});
