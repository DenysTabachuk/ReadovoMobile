export function isTokenKeyInsidePrefix(
  tokenKey: string | undefined,
  prefix: string,
): boolean {
  return tokenKey?.startsWith(`${prefix}-`) ?? false;
}
