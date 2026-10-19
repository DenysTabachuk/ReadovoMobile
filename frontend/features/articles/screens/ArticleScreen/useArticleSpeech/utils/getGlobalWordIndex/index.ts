import type { ArticleSpeechChunk } from '../../types';

/**
 * Translate the current chunk/word position into an article-wide word offset.
 *
 * @param chunks - Ordered speech chunks; inputs are not mutated.
 * @param chunkIndex - Current chunk index from the speech controller.
 * @param wordIndex - Word offset inside the current chunk.
 * @returns Words in preceding chunks plus the current offset; an empty list preserves the offset.
 * @example
 * getGlobalWordIndex([], 0, 0);
 * // => 0
 */
export function getGlobalWordIndex(
  chunks: ArticleSpeechChunk[],
  chunkIndex: number,
  wordIndex: number,
): number {
  const previousWords = chunks
    .slice(0, chunkIndex)
    .reduce((sum, chunk) => sum + chunk.words.length, 0);

  return previousWords + wordIndex;
}
