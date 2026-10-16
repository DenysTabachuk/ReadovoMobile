import { type TouchableTextPart } from '../../../../types';

/**
 * Locate the sentence containing the word currently being spoken.
 *
 * @param parts - Text parts belonging to the rendered block.
 * @param speakingTokenKey - Current spoken word key, or undefined when idle.
 * @returns The matched word part's sentence key, or undefined when no sentence is available.
 * @example
 * getSpeakingSentenceKey([
 *   { type: 'word', key: 'block-0-word-0-0', text: 'Hi', word: 'hi', sentenceKey: 'sentence-0' },
 * ], 'block-0-word-0-0');
 * // => 'sentence-0'
 */
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
