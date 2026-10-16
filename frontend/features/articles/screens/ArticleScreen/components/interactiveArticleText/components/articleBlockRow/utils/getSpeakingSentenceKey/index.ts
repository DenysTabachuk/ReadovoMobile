import { type TouchableTextPart } from '../../../../types';

export function getSpeakingSentenceKey(
  parts: TouchableTextPart[],
  speakingTokenKey: string | undefined,
): string | undefined {
  if (!speakingTokenKey) {
    return undefined;
  }

  return parts.find(
    (part): part is Extract<TouchableTextPart, { type: 'word' }> =>
      part.type === 'word' && part.key === speakingTokenKey,
  )?.sentenceKey;
}
