/**
 * Count whitespace-separated entries when filtering dictionary words and phrases.
 *
 * Punctuation is not a boundary; this distinguishes single-word entries from phrases,
 * rather than performing linguistic tokenization.
 *
 * @param value - Dictionary entry text.
 * @returns The number of nonempty whitespace-separated tokens; blank input returns zero.
 * @example
 * countWords('  take   off  ');
 * // => 2
 */
export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
