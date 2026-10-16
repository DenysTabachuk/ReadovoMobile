import {
  type ArticleBlock,
  type InlineNode,
} from '@/features/articles/api/wikipedia';
import { createInlineNodesFromPlainText } from '../createInlineNodesFromPlainText';

// Alphabetic list markers are single letters; a full word plus a period is a sentence.
const LIST_ITEM_PATTERN =
  /^([*#-]+|[\u2022\u25cf\u25aa\u25e6]+|(?:[A-Za-z]|\d+)[.)])\s*(.*)$/;

const SECTION_HEADING_PATTERN = /^(={2,})\s*(.*?)\s*\1$/;

/**
 * Convert fallback plain text into article paragraphs, headings, and lists.
 *
 * Consecutive paragraph lines are joined with spaces. Heading depth is capped at three;
 * this does not parse arbitrary HTML or Markdown.
 *
 * @param text - Text using blank lines, wiki-style headings, and supported list markers.
 * @returns Article blocks in reading order with tokenized inline text; blank input returns
 *   no blocks.
 * @example
 * parsePlainTextToBlocks('== Intro ==\nHello world.').map(({ type }) => type);
 * // => ['heading', 'paragraph']
 */
export function parsePlainTextToBlocks(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const lines = text.split(/\r?\n/);
  let paragraphLines: string[] = [];
  let listItems: InlineNode[][] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    const paragraphText = paragraphLines.join(' ').trim();

    if (!paragraphText) {
      paragraphLines = [];
      return;
    }

    blocks.push({
      children: createInlineNodesFromPlainText(paragraphText),
      type: 'paragraph',
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      items: listItems,
      ordered: listOrdered,
      type: 'list',
    });
    listItems = [];
    listOrdered = false;
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(SECTION_HEADING_PATTERN);

    if (headingMatch) {
      flushParagraph();
      flushList();
      const headingLevel = Math.min((headingMatch[1]?.length ?? 2) - 1, 3) as
        1 | 2 | 3;
      const headingText = headingMatch[2]?.trim() ?? line;

      if (headingText) {
        blocks.push({
          level: headingLevel,
          text: headingText,
          type: 'heading',
        });
      }

      continue;
    }

    const listItemMatch = line.match(LIST_ITEM_PATTERN);

    if (listItemMatch) {
      flushParagraph();
      const marker = listItemMatch[1] ?? '-';
      const itemText = listItemMatch[2]?.trim() ?? '';

      if (itemText) {
        listOrdered = marker.startsWith('#') || /^\d+[.)]$/.test(marker);
        listItems.push(createInlineNodesFromPlainText(itemText));
      }

      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
