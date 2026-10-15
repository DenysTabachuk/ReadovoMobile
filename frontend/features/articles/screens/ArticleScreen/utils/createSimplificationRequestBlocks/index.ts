import type { ArticleBlock } from '@/features/articles/api/wikipedia';

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
