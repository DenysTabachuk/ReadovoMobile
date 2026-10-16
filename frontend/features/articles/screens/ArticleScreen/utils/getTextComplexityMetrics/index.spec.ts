import { getTextComplexityMetrics } from './index';

describe('getTextComplexityMetrics', () => {
  it('measures normalized characters and English words without counting punctuation as word length', () => {
    expect(getTextComplexityMetrics('  Hi\n  all.  ')).toEqual({
      averageSentenceWords: 2,
      averageWordLength: 2.5,
      characterCount: 7,
      sentenceCount: 1,
      wordCount: 2,
    });
  });
  it('returns finite zero averages for empty text', () => {
    expect(getTextComplexityMetrics(' \n ')).toEqual({
      averageSentenceWords: 0,
      averageWordLength: 0,
      characterCount: 0,
      sentenceCount: 0,
      wordCount: 0,
    });
  });
  it('includes a final unpunctuated sentence in the comparison metrics', () => {
    expect(getTextComplexityMetrics('Hello. Bye').sentenceCount).toBe(2);
    expect(getTextComplexityMetrics('Hello. Bye').wordCount).toBe(2);
  });
});
