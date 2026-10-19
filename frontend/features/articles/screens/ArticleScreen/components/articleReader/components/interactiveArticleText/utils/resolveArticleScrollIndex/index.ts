import type { ArticleBlockListItem } from '../../types';

/**
 * Resolve an original article block index to its position in the visible list.
 *
 * @param items - Visible blocks, which may omit collapsed sections.
 * @param sourceIndex - Original block index used by speech token keys.
 * @returns The visible list index, or null when the block is hidden or absent.
 * @example
 * resolveArticleScrollIndex([{ key: 'block-8', sourceIndex: 8, block: { type: 'paragraph', children: [] } }], 8);
 * // => 0
 */
export function resolveArticleScrollIndex(
  items: readonly ArticleBlockListItem[],
  sourceIndex: number,
): number | null {
  const index = items.findIndex((item) => item.sourceIndex === sourceIndex);
  return index < 0 ? null : index;
}
