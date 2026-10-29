/**
 * Maps an untrusted Firebase error to safe feedback and token cleanup policy.
 * @param error - SDK rejection; only two exact registration-token codes are used.
 * @returns A fixed message and whether to deactivate the token. Unknown codes,
 * messages, stacks and objects are never converted to text or copied.
 * @example
 * resolveFcmFailure({ code: 'messaging/registration-token-not-registered' });
 * // { failureReason: 'Push token is invalid or no longer registered.', shouldDeactivateToken: true }
 */
export function resolveFcmFailure(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;
  const shouldDeactivateToken =
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/registration-token-not-registered';

  return {
    failureReason: shouldDeactivateToken
      ? 'Push token is invalid or no longer registered.'
      : 'Push delivery failed.',
    shouldDeactivateToken,
  };
}
