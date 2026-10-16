/**
 * Check whether a token belongs to a block or list-item subtree.
 *
 * The separator prevents block-1 from accidentally matching block-10.
 *
 * @param tokenKey - Token key to inspect, or undefined.
 * @param prefix - Subtree identifier without the trailing separator.
 * @returns True when the key starts with prefix followed by a hyphen; false for undefined.
 * @example
 * isTokenKeyInsidePrefix('block-10-word-0-0', 'block-1');
 * // => false
 */
export function isTokenKeyInsidePrefix(
  tokenKey: string | undefined,
  prefix: string,
): boolean {
  return tokenKey?.startsWith(`${prefix}-`) ?? false;
}
