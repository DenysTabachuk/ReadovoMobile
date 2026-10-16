import { type ArticleBlock } from '@/features/articles/api/wikipedia';
import { type ArticleBlockListItem } from '../../types';

export function createVisibleBlockItems(
  resolvedBlocks: ArticleBlock[],
  collapsedHeadings: Record<string, boolean>,
): ArticleBlockListItem[] {
  const activeCollapsedLevels: number[] = [];
  const items: ArticleBlockListItem[] = [];

  resolvedBlocks.forEach((block, index) => {
    if (block.type === 'heading') {
      for (
        let levelIndex = activeCollapsedLevels.length - 1;
        levelIndex >= 0;
        levelIndex -= 1
      ) {
        if (activeCollapsedLevels[levelIndex] >= block.level) {
          activeCollapsedLevels.splice(levelIndex, 1);
        }
      }

      const isHiddenByAncestor = activeCollapsedLevels.length > 0;
      const headingKey = createHeadingKey(block, index);
      const isCollapsed = Boolean(collapsedHeadings[headingKey]);

      if (isCollapsed) {
        activeCollapsedLevels.push(block.level);
      }

      if (!isHiddenByAncestor) {
        items.push({
          block,
          key: headingKey,
          sourceIndex: index,
        });
      }

      return;
    }

    if (activeCollapsedLevels.length > 0) {
      return;
    }

    items.push({
      block,
      key: `block-${index}`,
      sourceIndex: index,
    });
  });

  return items;
}

function createHeadingKey(
  block: Extract<ArticleBlock, { type: 'heading' }>,
  index: number,
): string {
  return `heading-${index}-${block.text}`;
}
