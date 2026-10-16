type SentenceRange = { end: number; start: number; text: string };

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

/**
 * Find sentence boundaries for translation context and speech highlighting.
 *
 * Line breaks also end sentences. Known abbreviations and dotted initials are kept
 * together; this is a heuristic, not a language parser.
 *
 * @param text - Source text whose original string offsets must be retained.
 * @returns Nonempty sentence ranges with inclusive start, exclusive end, and trimmed text;
 *   blank input returns no ranges.
 * @example
 * getSentenceRanges('Hi! Bye.');
 * // => [{ start: 0, end: 3, text: 'Hi!' }, { start: 3, end: 8, text: 'Bye.' }]
 */
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

    // A period inside an abbreviation must not detach a word from its sentence context.
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
