import { getSentenceRanges } from '../getSentenceRanges';

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
