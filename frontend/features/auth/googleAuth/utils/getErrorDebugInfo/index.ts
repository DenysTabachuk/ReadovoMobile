/**
 * Collect standard and native error details for Google sign-in diagnostics.
 *
 * @param error - Any thrown value, including non-Error values.
 * @returns Error fields when the value is an Error instance, otherwise an object retaining
 *   the raw value.
 * @example
 * getErrorDebugInfo('failed');
 * // => { rawError: 'failed' }
 */
export function getErrorDebugInfo(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      rawError: error,
    };
  }

  const nativeError = error as Error & {
    code?: string;
    nativeStackAndroid?: string[];
    userInfo?: unknown;
    domain?: string;
  };

  return {
    name: nativeError.name,
    message: nativeError.message,
    code: nativeError.code,
    domain: nativeError.domain,
    userInfo: nativeError.userInfo,
    nativeStackAndroid: nativeError.nativeStackAndroid,
    stack: nativeError.stack,
  };
}
