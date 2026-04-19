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
