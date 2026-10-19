import type { ArticleBlock } from '@/features/articles/api/types';

/**
 * Remove formula rendering payloads before sending article blocks for text transformation.
 *
 * Formula descriptions are enough for the text request; the original formula and its
 * rendering data remain unchanged.
 *
 * @param blocks - Original article blocks to prepare for the request.
 * @returns A new array; formula blocks retain only type, altText, and display, while other
 *   block references are reused.
 * @example
 * createSimplificationRequestBlocks([{ type: 'formula', altText: 'x', display: true, svg: '<svg />' }]);
 * // => [{ type: 'formula', altText: 'x', display: true }]
 */
export function createSimplificationRequestBlocks(
  blocks: ArticleBlock[],
): ArticleBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'formula') {
      return block;
    }

    return {
      altText: block.altText,
      display: block.display,
      type: 'formula',
    };
  });
}
