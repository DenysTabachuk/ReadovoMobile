type ReadingPart = { text: string; highlighted: boolean };

/**
 * Splits English text into plain and vocabulary spans, preserving every character.
 * @param text - Original paragraph, including punctuation and whitespace.
 * @param words - Literal vocabulary words or phrases; empty entries are ignored.
 * @returns Case-insensitive whole-term matches without matching inside English words.
 * Inputs are not changed; regex characters in vocabulary are treated literally.
 * @example highlightReadingWords('A warm tent.', ['tent'])
 * // [{ text: 'A warm ', highlighted: false }, { text: 'tent', highlighted: true }, { text: '.', highlighted: false }]
 */
export function highlightReadingWords(
  text: string,
  words: string[],
): ReadingPart[] {
  const terms = Array.from(
    new Set(words.map((word) => word.trim()).filter(Boolean)),
  )
    .sort((left, right) => right.length - left.length)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (terms.length === 0) return [{ text, highlighted: false }];
  const pattern = new RegExp(
    `(^|[^A-Za-z])(${terms.join('|')})(?=$|[^A-Za-z])`,
    'gi',
  );
  const parts: ReadingPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index + match[1].length;
    if (start > cursor)
      parts.push({ text: text.slice(cursor, start), highlighted: false });
    parts.push({ text: match[2], highlighted: true });
    cursor = start + match[2].length;
  }
  if (cursor < text.length)
    parts.push({ text: text.slice(cursor), highlighted: false });
  return parts;
}
