import { getSentenceRanges } from './index';

describe('getSentenceRanges', () => {
  it('keeps original offsets while trimming sentence text', () => {
    expect(getSentenceRanges('  Hi! Bye.')).toEqual([
      { start: 0, end: 5, text: 'Hi!' },
      { start: 5, end: 10, text: 'Bye.' },
    ]);
  });
  it('handles CRLF, final unpunctuated text, and empty input', () => {
    expect(getSentenceRanges('First line\r\nLast line')).toEqual([
      { start: 0, end: 11, text: 'First line' },
      { start: 12, end: 21, text: 'Last line' },
    ]);
    expect(getSentenceRanges(' \n ')).toEqual([]);
  });
  it('keeps abbreviations and decimal punctuation inside a sentence', () => {
    expect(
      getSentenceRanges('Dr. Smith measured 3.14 mm. Next step.').map(
        (range) => range.text,
      ),
    ).toEqual(['Dr. Smith measured 3.14 mm.', 'Next step.']);
  });
  it('treats repeated terminal punctuation as one boundary', () => {
    expect(
      getSentenceRanges('Really?! Yes...').map((range) => range.text),
    ).toEqual(['Really?!', 'Yes...']);
  });
});
