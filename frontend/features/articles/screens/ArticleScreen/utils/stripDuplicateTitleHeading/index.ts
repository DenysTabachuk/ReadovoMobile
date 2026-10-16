import type { ArticleBlock } from '@/features/articles/api/wikipedia';

/**
 * Remove a leading title heading when the article screen already renders that title.
 *
 * @param blocks - Original content blocks.
 * @param articleTitle - Title shown separately by the screen.
 * @returns A sliced array if the first block is a matching level-1 heading; otherwise the
 *   original array. Comparison ignores outer whitespace and case.
 * @example
 * stripDuplicateTitleHeading([{ type: 'heading', level: 1, text: ' Intro ' }], 'intro');
 * // => []
 */
export function stripDuplicateTitleHeading(
  blocks: ArticleBlock[],
  articleTitle: string,
): ArticleBlock[] {
  const normalizedTitle = articleTitle.trim().toLowerCase();
  const firstBlock = blocks[0];

  if (
    firstBlock?.type === 'heading' &&
    firstBlock.level === 1 &&
    firstBlock.text.trim().toLowerCase() === normalizedTitle
  ) {
    return blocks.slice(1);
  }

  return blocks;
}
