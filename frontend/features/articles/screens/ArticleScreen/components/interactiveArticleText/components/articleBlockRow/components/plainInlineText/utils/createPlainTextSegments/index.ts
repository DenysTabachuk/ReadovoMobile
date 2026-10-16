import { type InlineNode } from '@/features/articles/api/wikipedia';

export function createPlainTextSegments(
  nodes: InlineNode[],
): PlainTextSegment[] {
  const segments: PlainTextSegment[] = [];

  nodes.forEach((node, index) => {
    const previousSegment = segments[segments.length - 1];

    if (
      previousSegment &&
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

type PlainTextSegment = {
  bold?: boolean;
  italic?: boolean;
  key: string;
  text: string;
};
