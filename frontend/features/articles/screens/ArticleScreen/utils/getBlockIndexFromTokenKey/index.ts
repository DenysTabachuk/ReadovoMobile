/**
 * Recover the source block index from a selectable word key for scrolling.
 *
 * @param tokenKey - A key starting with block-N, optionally followed by token details.
 * @returns The finite source index, or null for missing keys or other formats such as table
 *   keys.
 * @example
 * getBlockIndexFromTokenKey('block-12-item-0-word-1-5');
 * // => 12
 */
export function getBlockIndexFromTokenKey(
  tokenKey: string | undefined,
): number | null {
  const match = tokenKey?.match(/^block-(\d+)(?:-|$)/);
  const blockIndex = match?.[1] ? Number(match[1]) : NaN;

  if (!Number.isFinite(blockIndex)) {
    return null;
  }

  return blockIndex;
}
