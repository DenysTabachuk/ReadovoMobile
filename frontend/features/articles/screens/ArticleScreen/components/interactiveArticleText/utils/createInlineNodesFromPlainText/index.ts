import { type InlineNode } from '@/features/articles/api/wikipedia';

/**
 * Tokenize unformatted text for per-word interaction and translation.
 *
 * Recognizes Latin words with internal apostrophes or hyphens; unsupported scripts and
 * punctuation stay in text nodes.
 *
 * @param text - Plain text to tokenize without changing its spacing or punctuation.
 * @returns Ordered word and text nodes; empty input returns an empty array.
 * @example
 * createInlineNodesFromPlainText('Hi!');
 * // => [{ text: 'Hi', type: 'word' }, { text: '!', type: 'text' }]
 */
export function createInlineNodesFromPlainText(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      nodes.push({
        text: text.slice(cursor, start),
        type: 'text',
      });
    }

    nodes.push({
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < text.length) {
    nodes.push({
      text: text.slice(cursor),
      type: 'text',
    });
  }

  return nodes;
}
