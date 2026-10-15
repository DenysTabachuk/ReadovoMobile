import type { TextComplexityMetrics } from '../../types';

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
