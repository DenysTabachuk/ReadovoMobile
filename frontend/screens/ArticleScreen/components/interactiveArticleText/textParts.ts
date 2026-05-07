import { type InlineNode } from '@/api/wikipedia';

type SentenceRange = {
  end: number;
  start: number;
  text: string;
};

export type TouchableTextPart =
  | {
      bold?: boolean;
      italic?: boolean;
      key: string;
      text: string;
      type: 'text';
    }
  | {
      bold?: boolean;
      contextSentence?: string;
      italic?: boolean;
      key: string;
      text: string;
      type: 'word';
      word: string;
    };

const SENTENCE_ABBREVIATIONS = [
  'approx.',
  'dr.',
  'e.g.',
  'etc.',
  'i.e.',
  'jr.',
  'mr.',
  'mrs.',
  'ms.',
  'prof.',
  'sr.',
  'st.',
  'vs.',
];
const MIN_USEFUL_CONTEXT_LENGTH = 24;
const CONTEXT_WINDOW_RADIUS = 140;

export function splitTextToTouchableParts(
  nodes: InlineNode[],
  prefix: string,
): TouchableTextPart[] {
  const text = nodes.map((node) => node.text).join('');
  const parts: TouchableTextPart[] = [];
  let cursor = 0;

  nodes.forEach((node, index) => {
    const start = cursor;
    const end = start + node.text.length;

    if (node.type === 'word') {
      parts.push({
        bold: node.bold,
        contextSentence: getWordContext(text, start, end),
        italic: node.italic,
        key: `${prefix}-word-${index}-${start}`,
        text: node.text,
        type: 'word',
        word: normalizeWord(node.text),
      });
    } else {
      parts.push({
        bold: node.bold,
        italic: node.italic,
        key: `${prefix}-text-${index}-${start}`,
        text: node.text,
        type: 'text',
      });
    }

    cursor = end;
  });

  return parts;
}

export function getWordContext(text: string, start: number, end: number): string {
  const sentence = getContextSentence(text, start, end);
  const word = text.slice(start, end).trim();

  if (isUsefulContext(sentence, word)) {
    return sentence;
  }

  return createContextWindow(text, start, end);
}

export function getContextSentence(text: string, start: number, end: number): string {
  const sentence = getSentenceRanges(text).find(
    (range) => range.start <= start && start < range.end && end <= range.end,
  );

  return sentence?.text ?? '';
}

function isUsefulContext(context: string, word: string): boolean {
  if (!context || context.length < Math.max(MIN_USEFUL_CONTEXT_LENGTH, word.length)) {
    return false;
  }

  if (hasUnbalancedParentheses(context)) {
    return false;
  }

  return context.toLowerCase().includes(word.toLowerCase());
}

function hasUnbalancedParentheses(context: string): boolean {
  let balance = 0;

  for (const character of context) {
    if (character === '(') {
      balance += 1;
      continue;
    }

    if (character === ')') {
      balance = Math.max(0, balance - 1);
    }
  }

  return balance > 0;
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

function getSentenceRanges(text: string): SentenceRange[] {
  const ranges: SentenceRange[] = [];
  let sentenceStart = 0;
  let index = 0;

  while (index < text.length) {
    const character = text[index];

    if (character === '\n') {
      appendSentenceRange({
        end: index,
        ranges,
        start: sentenceStart,
        text,
      });
      sentenceStart = index + 1;
      index += 1;
      continue;
    }

    if (!isSentenceTerminal(character)) {
      index += 1;
      continue;
    }

    const boundaryEnd = getSentenceBoundaryEnd(text, index);

    if (
      boundaryEnd === null ||
      isAbbreviationBoundary(text.slice(sentenceStart, boundaryEnd))
    ) {
      index += 1;
      continue;
    }

    appendSentenceRange({
      end: boundaryEnd,
      ranges,
      start: sentenceStart,
      text,
    });
    sentenceStart = boundaryEnd;
    index = boundaryEnd;
  }

  appendSentenceRange({
    end: text.length,
    ranges,
    start: sentenceStart,
    text,
  });

  return ranges;
}

function appendSentenceRange(params: {
  end: number;
  ranges: SentenceRange[];
  start: number;
  text: string;
}) {
  const sentenceText = params.text.slice(params.start, params.end).trim();

  if (!sentenceText) {
    return;
  }

  params.ranges.push({
    end: params.end,
    start: params.start,
    text: sentenceText,
  });
}

function getSentenceBoundaryEnd(text: string, terminalIndex: number): number | null {
  let boundaryEnd = terminalIndex + 1;

  while (boundaryEnd < text.length && isSentenceTerminal(text[boundaryEnd])) {
    boundaryEnd += 1;
  }

  const nextCharacter = text[boundaryEnd];

  if (nextCharacter && !/\s/.test(nextCharacter)) {
    return null;
  }

  return boundaryEnd;
}

function isAbbreviationBoundary(sentencePrefix: string): boolean {
  const normalizedPrefix = sentencePrefix.trim().toLowerCase();

  if (SENTENCE_ABBREVIATIONS.some((abbreviation) => normalizedPrefix.endsWith(abbreviation))) {
    return true;
  }

  return /(?:^|[\s([{])(?:[a-z]\.){2,}$/.test(normalizedPrefix);
}

function isSentenceTerminal(character: string | undefined): boolean {
  return character === '.' || character === '!' || character === '?';
}

function normalizeWord(word: string): string {
  return word.replaceAll('\u2019', "'").toLowerCase();
}
