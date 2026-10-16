import { type ArticleBlock } from '@/features/articles/api/wikipedia';
import { type ArticleBlockListItem } from '../../types';

/**
 * Build the article list while hiding the contents of collapsed sections.
 *
 * Original indexes keep word token keys and speech navigation aligned even when earlier
 * sections are hidden.
 *
 * @param resolvedBlocks - All article blocks in their original order.
 * @param collapsedHeadings - Heading keys mapped to their collapsed state.
 * @returns Visible items with stable keys and original source indexes; referenced blocks
 *   are not copied or mutated.
 * @example
 * createVisibleBlockItems([
 *   { type: 'heading', level: 1, text: 'Intro' },
 *   { type: 'paragraph', children: [] },
 * ], { 'heading-0-Intro': true }).map(({ key, sourceIndex }) => [key, sourceIndex]);
 * // => [['heading-0-Intro', 0]]
 */
export function createVisibleBlockItems(
  resolvedBlocks: ArticleBlock[],
  collapsedHeadings: Record<string, boolean>,
): ArticleBlockListItem[] {
  const activeCollapsedLevels: number[] = [];
  const items: ArticleBlockListItem[] = [];

  resolvedBlocks.forEach((block, index) => {
    if (block.type === 'heading') {
      // A sibling or ancestor heading ends the preceding collapsed section.
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
