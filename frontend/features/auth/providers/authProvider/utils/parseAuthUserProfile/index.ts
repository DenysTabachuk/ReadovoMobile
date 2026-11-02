import type { AuthUserProfile } from '../../../../types';

/**
 * Validates a profile from storage or a login response before exposing a session.
 * @param value - Untrusted decoded profile.
 * @returns A profile with a nonblank ID, or null for invalid/missing fields.
 * @example
 * parseAuthUserProfile({ id: 'reader-a', email: null, displayName: null });
 * // => { id: 'reader-a', email: null, displayName: null }
 */
export function parseAuthUserProfile(value: unknown): AuthUserProfile | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    !('email' in value) ||
    (value.email !== null && typeof value.email !== 'string') ||
    !('displayName' in value) ||
    (value.displayName !== null && typeof value.displayName !== 'string')
  )
    return null;

  return { id: value.id, email: value.email, displayName: value.displayName };
}
