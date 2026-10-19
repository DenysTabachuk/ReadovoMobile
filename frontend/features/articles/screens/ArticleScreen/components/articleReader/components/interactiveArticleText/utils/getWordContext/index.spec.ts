import { getWordContext } from './index';

describe('getWordContext', () => {
  it('prefers a complete useful sentence over surrounding text', () => {
    const sentence = 'The quick brown fox jumps over the dog.';
    const text = sentence + ' Another sentence follows.';
    expect(getWordContext(text, 16, 19)).toBe(sentence);
  });
  it('expands a short fragment to nearby readable context', () => {
    expect(
      getWordContext(
        'Hi! This is enough surrounding text for translation.',
        0,
        2,
      ),
    ).toBe('Hi! This is enough surrounding text for translation.');
  });
  it('uses a bounded window for a tiny sentence inside a long document', () => {
    const text = 'Before. '.repeat(50) + 'Hi! ' + 'After '.repeat(50);
    const start = text.indexOf('Hi!');
    const context = getWordContext(text, start, start + 2);
    expect(context).toContain('Hi!');
    expect(context.length).toBeLessThanOrEqual(282);
    expect(context).not.toBe(text.trim());
    expect(context.startsWith('Before.')).toBe(true);
    expect(context.endsWith('After')).toBe(true);
  });
  it('handles empty source text', () => {
    expect(getWordContext('', 0, 0)).toBe('');
  });
});
