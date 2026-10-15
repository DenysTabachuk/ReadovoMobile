import { getContextSentence } from '../getContextSentence';
import { isUsefulContext } from '../isUsefulContext';

const CONTEXT_WINDOW_RADIUS = 140;

export function getWordContext(
  text: string,
  start: number,
  end: number,
): string {
  const sentence = getContextSentence(text, start, end);
  const word = text.slice(start, end).trim();

  if (isUsefulContext(sentence, word)) {
    return sentence;
  }

  return createContextWindow(text, start, end);
}

function createContextWindow(text: string, start: number, end: number): string {
  const rawWindowStart = Math.max(0, start - CONTEXT_WINDOW_RADIUS);
  const rawWindowEnd = Math.min(text.length, end + CONTEXT_WINDOW_RADIUS);
  const windowStart = findReadableWindowStart(text, rawWindowStart);
  const windowEnd = findReadableWindowEnd(text, rawWindowEnd);
  const context = text.slice(windowStart, windowEnd).trim();

  if (context) {
    return context;
  }

  return text.trim();
}

function findReadableWindowStart(text: string, start: number): number {
  if (start === 0) {
    return start;
  }

  const nextWhitespaceIndex = text.slice(start).search(/\s/);

  if (nextWhitespaceIndex < 0) {
    return start;
  }

  return start + nextWhitespaceIndex + 1;
}

function findReadableWindowEnd(text: string, end: number): number {
  if (end === text.length) {
    return end;
  }

  const previousWhitespaceIndex = text.slice(0, end).search(/\s+\S*$/);

  if (previousWhitespaceIndex < 0) {
    return end;
  }

  return previousWhitespaceIndex;
}
