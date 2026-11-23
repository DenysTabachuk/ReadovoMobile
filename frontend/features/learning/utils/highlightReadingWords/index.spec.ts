import { highlightReadingWords } from './index';

it('preserves punctuation and case while highlighting complete words and phrases', () => {
  const text = 'A TENT, apple juice and a pretzel.';
  const parts = highlightReadingWords(text, ['tent', 'apple juice', 'pretzel']);
  expect(
    parts.filter((part) => part.highlighted).map((part) => part.text),
  ).toEqual(['TENT', 'apple juice', 'pretzel']);
  expect(parts.map((part) => part.text).join('')).toBe(text);
});
it('does not highlight inside words and treats regex metacharacters literally', () => {
  expect(
    highlightReadingWords('attend tent C++ Caa', ['tent', 'C++'])
      .filter((part) => part.highlighted)
      .map((part) => part.text),
  ).toEqual(['tent', 'C++']);
});
it('prefers longer terms and preserves consecutive matching words', () => {
  expect(
    highlightReadingWords('apple juice tent tent', [
      'apple',
      'apple juice',
      'tent',
    ])
      .filter((part) => part.highlighted)
      .map((part) => part.text),
  ).toEqual(['apple juice', 'tent', 'tent']);
});
it('handles empty vocabularies and empty paragraphs', () => {
  expect(highlightReadingWords('Hello.', ['', ' '])).toEqual([
    { text: 'Hello.', highlighted: false },
  ]);
  expect(highlightReadingWords('', ['tent'])).toEqual([]);
});
