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

export function getSentenceRanges(text: string): SentenceRange[] {
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

function getSentenceBoundaryEnd(
  text: string,
  terminalIndex: number,
): number | null {
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

  if (
    SENTENCE_ABBREVIATIONS.some((abbreviation) =>
      normalizedPrefix.endsWith(abbreviation),
    )
  ) {
    return true;
  }

  return /(?:^|[\s([{])(?:[a-z]\.){2,}$/.test(normalizedPrefix);
}

function isSentenceTerminal(character: string | undefined): boolean {
  return character === '.' || character === '!' || character === '?';
}

type SentenceRange = { end: number; start: number; text: string };
