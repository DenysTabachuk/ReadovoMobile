/**
 * Parse the first route parameter as a positive, safe integer article ID.
 *
 * @param value - Article route parameter; arrays use their first value.
 * @returns The article ID, or null for missing, blank, or invalid IDs.
 * @example
 * parseArticleId(['42', '99']);
 * // => 42
 */
export function parseArticleId(value?: string | string[]): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue?.trim()) {
    return null;
  }

  const articleId = Number(rawValue);
  return Number.isSafeInteger(articleId) && articleId > 0 ? articleId : null;
}
