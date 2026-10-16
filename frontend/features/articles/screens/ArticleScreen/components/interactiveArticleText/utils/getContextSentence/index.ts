import { getSentenceRanges } from '../getSentenceRanges';

/**
 * Find the sentence containing an entire selected text range.
 *
 * @param text - Full source text used to calculate sentence boundaries.
 * @param start - Inclusive selection offset in the source string.
 * @param end - Exclusive selection offset in the source string.
 * @returns Trimmed sentence text, or an empty string when no single sentence contains the
 *   range.
 * @example
 * getContextSentence('Hello world. Next.', 6, 11);
 * // => 'Hello world.'
 */
export function getContextSentence(
  text: string,
  start: number,
  end: number,
): string {
  const sentence = getSentenceRanges(text).find(
    (range) => range.start <= start && start < range.end && end <= range.end,
  );

  return sentence?.text ?? '';
}
