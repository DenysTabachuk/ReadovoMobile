/**
 * Carries a known native Google sign-in presentation key separately from message.
 * @param messageKey - App-owned key selected by the Google SDK integration.
 * @example
 * new GoogleSignInError('auth.errors.googleSignInInProgress').messageKey;
 * // => 'auth.errors.googleSignInInProgress'
 */
export class GoogleSignInError extends Error {
  constructor(readonly messageKey: string) {
    super('Google sign-in failed.');
    this.name = 'GoogleSignInError';
  }
}
