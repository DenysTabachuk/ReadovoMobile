import { type InlineNode } from '@/features/articles/api/wikipedia';

type PlainTextSegment = {
  bold?: boolean;
  italic?: boolean;
  key: string;
  text: string;
};

/**
 * Merge adjacent inline nodes with matching emphasis into plain-text segments.
 * PlainInlineText renders one nested <Text> per segment, so merging reduces the
 * number of rendered elements while preserving bold and italic formatting.
 * This is used for plain display, where each word does not need its own element
 * for interaction. The performance impact has not been measured.
 *
 * @param nodes - Ordered inline nodes whose text and emphasis should be preserved.
 * @returns New segments keyed by their first node's index, or an empty array for
 * empty input. Input nodes are not mutated.
 * @example
 * createPlainTextSegments([
 *   { type: 'word', text: 'Hello' },
 *   { type: 'text', text: ' world' },
 *   { type: 'word', text: '!', bold: true },
 * ]);
 * // => [
 * //   { key: 'plain-0', text: 'Hello world', bold: undefined, italic: undefined },
 * //   { key: 'plain-2', text: '!', bold: true, italic: undefined },
 * // ]
 */
export function createPlainTextSegments(
  nodes: InlineNode[],
): PlainTextSegment[] {
  const segments: PlainTextSegment[] = [];

  nodes.forEach((node, index) => {
    const previousSegment = segments[segments.length - 1];

    if (
      previousSegment &&
      // Missing emphasis flags and explicit false both mean unstyled text.
      Boolean(previousSegment.bold) === Boolean(node.bold) &&
      Boolean(previousSegment.italic) === Boolean(node.italic)
    ) {
      previousSegment.text += node.text;
      return;
    }

    segments.push({
      bold: node.bold,
      italic: node.italic,
      key: `plain-${index}`,
      text: node.text,
    });
  });

  return segments;
}
