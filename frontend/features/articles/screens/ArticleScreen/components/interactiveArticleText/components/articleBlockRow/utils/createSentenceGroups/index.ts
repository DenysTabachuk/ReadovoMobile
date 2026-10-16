import { type TouchableTextPart } from '../../../../types';

type PlainSentenceGroup = {
  key: string;
  parts: TouchableTextPart[];
  sentenceKey?: string;
};

/**
 * Group adjacent text parts so a spoken sentence can be highlighted as a unit.
 *
 * Parts without a sentence key stay with the preceding group, keeping punctuation and
 * whitespace attached to it.
 *
 * @param parts - Ordered word and separator parts with optional sentence keys.
 * @returns New groups preserving part order and references; an empty input produces no groups.
 * @example
 * createSentenceGroups([{ type: 'text', key: 'space', text: ' ' }]);
 * // => [{ key: 'space', parts: [{ type: 'text', key: 'space', text: ' ' }], sentenceKey: undefined }]
 */
export function createSentenceGroups(
  parts: TouchableTextPart[],
): PlainSentenceGroup[] {
  const groups: PlainSentenceGroup[] = [];

  parts.forEach((part) => {
    const sentenceKey = part.type === 'word' ? part.sentenceKey : undefined;
    const currentGroup = groups[groups.length - 1];

    if (
      currentGroup &&
      (!sentenceKey || currentGroup.sentenceKey === sentenceKey)
    ) {
      currentGroup.parts.push(part);
      return;
    }

    groups.push({
      key: sentenceKey ?? part.key,
      parts: [part],
      sentenceKey,
    });
  });

  return groups;
}
