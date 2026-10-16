import { type TouchableTextPart } from '../../../../types';

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

type PlainSentenceGroup = {
  key: string;
  parts: TouchableTextPart[];
  sentenceKey?: string;
};
