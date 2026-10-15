const MILLISECONDS_PER_SECOND = 1000;

export function isJwtExpired(token: string | null): boolean {
  if (!token) {
    return true;
  }

  try {
    const [, encodedPayload] = token.split('.');
    const payload = JSON.parse(atob(encodedPayload ?? '')) as { exp?: number };

    return (
      typeof payload.exp !== 'number' ||
      payload.exp * MILLISECONDS_PER_SECOND <= Date.now()
    );
  } catch {
    return true;
  }
}
