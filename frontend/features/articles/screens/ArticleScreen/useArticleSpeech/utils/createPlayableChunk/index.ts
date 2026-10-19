import type { ArticleSpeechChunk } from '../../types';

/**
 * Slice a speech chunk from a saved word and rebase its character offsets.
 *
 * @param chunk - Original text and absolute word offsets, left unchanged.
 * @param startWordIndex - Saved word index to resume from.
 * @returns A sliced chunk with copied word metadata, or the original reference when the index is absent.
 * @example
 * createPlayableChunk({ text: 'Hi all', words: [{ charStart: 3, charEnd: 6, text: 'all', tokenKey: 'w' }] }, 0).text;
 * // => 'all'
 */
export function createPlayableChunk(
  chunk: ArticleSpeechChunk,
  startWordIndex: number,
): ArticleSpeechChunk {
  const firstWord = chunk.words[startWordIndex];

  if (!firstWord) {
    return chunk;
  }

  const charOffset = firstWord.charStart;
  const words = chunk.words.slice(startWordIndex).map((word) => ({
    ...word,
    charEnd: word.charEnd - charOffset,
    charStart: word.charStart - charOffset,
  }));

  return {
    text: chunk.text.slice(charOffset),
    words,
  };
}
