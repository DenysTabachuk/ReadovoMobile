import type { ArticleBlock } from '@/features/articles/api/wikipedia';

/**
 * Flatten article blocks into readable text for complexity measurements.
 *
 * @param blocks - Structured article content in reading order.
 * @returns Text separated by blank lines, using formula alt text and image descriptions; no
 *   blocks produce an empty string.
 * @example
 * extractTextFromArticleBlocks([{ type: 'heading', level: 1, text: 'Intro' }, { type: 'paragraph', children: [{ type: 'word', text: 'Hello' }] }]);
 * // => 'Intro\n\nHello'
 */
export function extractTextFromArticleBlocks(blocks: ArticleBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'heading') {
        return block.text;
      }

      if (block.type === 'paragraph') {
        return block.children.map((node) => node.text).join('');
      }

      if (block.type === 'list') {
        return block.items
          .map((item) => item.map((node) => node.text).join(''))
          .join('\n');
      }

      if (block.type === 'table') {
        return block.rows
          .map((row) => row.map((cell) => cell.text).join(' '))
          .join('\n');
      }

      if (block.type === 'formula') {
        return block.altText;
      }

      return [block.alt, block.caption].filter(Boolean).join(' ');
    })
    .filter(Boolean)
    .join('\n\n');
}
