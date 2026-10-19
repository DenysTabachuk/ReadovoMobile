import { type InlineNode } from '@/features/articles/api';

/**
 * Split text nodes into selectable English word tokens while preserving emphasis.
 *
 * Recognizes Latin words with internal apostrophes or hyphens; other characters remain text
 * nodes.
 *
 * @param nodes - Inline nodes, including text nodes that may still contain whole sentences.
 * @returns A new node array with existing word nodes reused and text nodes split without
 *   mutating input.
 * @example
 * normalizeInlineNodesForWordSelection([{ type: 'text', text: 'Hello!', bold: true }])
 *   .map(({ type, text }) => [type, text]);
 * // => [['word', 'Hello'], ['text', '!']]
 */
export function normalizeInlineNodesForWordSelection(
  nodes: InlineNode[],
): InlineNode[] {
  const normalized: InlineNode[] = [];

  nodes.forEach((node) => {
    if (node.type === 'word') {
      normalized.push(node);
      return;
    }

    normalized.push(...splitTextNodeToInlineNodes(node));
  });

  return normalized;
}

function splitTextNodeToInlineNodes(
  node: Extract<InlineNode, { type: 'text' }>,
): InlineNode[] {
  const result: InlineNode[] = [];
  let cursor = 0;

  for (const match of node.text.matchAll(
    /[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g,
  )) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      result.push({
        bold: node.bold,
        italic: node.italic,
        text: node.text.slice(cursor, start),
        type: 'text',
      });
    }

    result.push({
      bold: node.bold,
      italic: node.italic,
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < node.text.length) {
    result.push({
      bold: node.bold,
      italic: node.italic,
      text: node.text.slice(cursor),
      type: 'text',
    });
  }

  if (result.length === 0) {
    return [node];
  }

  return result;
}
