import type { ArticleBlock } from '@/features/articles/api/wikipedia';

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
