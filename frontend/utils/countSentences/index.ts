/**
 * Estimate sentence count when choosing a quiz length for original article text.
 *
 * This is a lightweight heuristic: abbreviations may count as boundaries and an
 * unpunctuated trailing fragment is not counted separately.
 *
 * @param text - Text to inspect for sentence-ending punctuation.
 * @returns The number of punctuation runs followed by whitespace or the end; zero for blank
 *   text, or one when nonblank text has no such run.
 * @example
 * countSentences('Hello! How are you?');
 * // => 2
 */
export function countSentences(text: string): number {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return 0;
  }

  const matches = normalizedText.match(/[.!?]+(?=\s|$)/g);
  return matches?.length ?? 1;
}
