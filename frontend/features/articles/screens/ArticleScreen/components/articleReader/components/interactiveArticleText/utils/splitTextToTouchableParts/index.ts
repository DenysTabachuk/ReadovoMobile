import type { InlineNode } from '@/features/articles/api';
import type { TouchableTextPart } from '../../types';
import { getSentenceRanges } from '../getSentenceRanges';
import { getWordContext } from '../getWordContext';
import { isUsefulContext } from '../isUsefulContext';

/**
 * Attach stable token keys, sentence positions, and translation context to inline nodes.
 *
 * Keys include the original node index and character offset so selection and speech can
 * refer to the same word. Input is not mutated.
 *
 * @param nodes - Ordered inline nodes with words already tokenized.
 * @param prefix - Block or list-item identifier used to namespace generated keys.
 * @returns New render parts preserving emphasis and source text; empty input returns no parts.
 * @example
 * splitTextToTouchableParts([{ type: 'word', text: 'Hello' }], 'block-0')
 *   .map(({ key }) => key);
 * // => ['block-0-word-0-0']
 */
export function splitTextToTouchableParts(
  nodes: InlineNode[],
  prefix: string,
): TouchableTextPart[] {
  const text = nodes.map((node) => node.text).join('');
  const sentenceRanges = getSentenceRanges(text);
  const sentenceWordIndexes = new Map<number, number>();
  const parts: TouchableTextPart[] = [];
  let cursor = 0;

  nodes.forEach((node, index) => {
    const start = cursor;
    const end = start + node.text.length;

    if (node.type === 'word') {
      const sentenceIndex = sentenceRanges.findIndex(
        (range) =>
          range.start <= start && start < range.end && end <= range.end,
      );
      const sentence =
        sentenceIndex >= 0 ? sentenceRanges[sentenceIndex] : undefined;
      const nextSentenceWordIndex =
        sentenceIndex >= 0
          ? (sentenceWordIndexes.get(sentenceIndex) ?? 0)
          : undefined;

      if (sentenceIndex >= 0) {
        sentenceWordIndexes.set(
          sentenceIndex,
          (nextSentenceWordIndex ?? 0) + 1,
        );
      }

      parts.push({
        bold: node.bold,
        contextSentence:
          sentence && isUsefulContext(sentence.text, normalizeWord(node.text))
            ? sentence.text
            : getWordContext(text, start, end),
        italic: node.italic,
        key: `${prefix}-word-${index}-${start}`,
        sentenceKey:
          sentenceIndex >= 0
            ? `${prefix}-sentence-${sentenceIndex}`
            : undefined,
        sentenceWordIndex: nextSentenceWordIndex,
        text: node.text,
        type: 'word',
        word: normalizeWord(node.text),
      });
    } else {
      parts.push({
        bold: node.bold,
        italic: node.italic,
        key: `${prefix}-text-${index}-${start}`,
        text: node.text,
        type: 'text',
      });
    }

    cursor = end;
  });

  return parts;
}

function normalizeWord(word: string): string {
  return word.replaceAll('\u2019', "'").toLowerCase();
}
