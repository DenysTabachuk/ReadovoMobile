import type { TextComplexityMetrics } from '../../types';

/**
 * Estimate text size and English word/sentence averages for the comparison panel.
 *
 * Uses Latin-word and punctuation heuristics, not a reading-level model. A denominator of
 * at least one avoids division by zero.
 *
 * @param text - Text to measure after whitespace is collapsed and trimmed.
 * @returns Word, sentence, and normalized character counts plus average word and sentence
 *   lengths; empty input produces zeros.
 * @example
 * getTextComplexityMetrics('Hi all.');
 * // => { averageSentenceWords: 2, averageWordLength: 2.5, characterCount: 7, sentenceCount: 1, wordCount: 2 }
 */
export function getTextComplexityMetrics(text: string): TextComplexityMetrics {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const words = normalizedText.match(/[A-Za-z]+(?:['-][A-Za-z]+)?/g) ?? [];
  const sentences =
    normalizedText
      .match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)
      ?.filter((sentence) => sentence.trim()) ?? [];
  const totalWordLength = words.reduce((total, word) => total + word.length, 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = words.length;

  return {
    averageSentenceWords: wordCount / sentenceCount,
    averageWordLength: wordCount > 0 ? totalWordLength / wordCount : 0,
    characterCount: normalizedText.length,
    sentenceCount: sentences.length,
    wordCount,
  };
}
