import type { ArticleSpeechWord } from '../../types';

/**
 * Match a speech boundary to a word, skipping whitespace to the next word.
 *
 * @param words - Words ordered by character position.
 * @param charIndex - Character offset reported by the speech engine.
 * @returns The matching or next index, the last index after the text, or -1 for no words.
 * @example
 * findWordIndexAtChar([{ charStart: 0, charEnd: 2, text: 'Hi', tokenKey: 'w' }], 1);
 * // => 0
 */
export function findWordIndexAtChar(
  words: ArticleSpeechWord[],
  charIndex: number,
): number {
  const exactIndex = words.findIndex(
    (word) => word.charStart <= charIndex && charIndex < word.charEnd,
  );

  if (exactIndex >= 0) {
    return exactIndex;
  }

  const nextIndex = words.findIndex((word) => word.charStart >= charIndex);

  if (nextIndex >= 0) {
    return nextIndex;
  }

  return words.length - 1;
}
