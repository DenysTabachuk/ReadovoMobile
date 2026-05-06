export function countSentences(text: string): number {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return 0;
  }

  const matches = normalizedText.match(/[.!?]+(?=\s|$)/g);
  return matches?.length ?? 1;
}
