import { getSpeakingSentenceKey } from './index';

describe('getSpeakingSentenceKey', () => {
  const parts: Parameters<typeof getSpeakingSentenceKey>[0] = [
    { type: 'text', key: 'separator', text: ' ' },
    {
      type: 'word',
      key: 'w0',
      text: 'Hello',
      word: 'hello',
      sentenceKey: 's0',
    },
    { type: 'word', key: 'w1', text: 'Bye', word: 'bye' },
  ];
  it('finds the sentence for a spoken word', () => {
    expect(getSpeakingSentenceKey(parts, 'w0')).toBe('s0');
  });
  it.each([undefined, 'missing', 'separator', 'w1'])(
    'has no sentence for %j',
    (key) => {
      expect(getSpeakingSentenceKey(parts, key)).toBeUndefined();
    },
  );
  it('handles empty parts', () => {
    expect(getSpeakingSentenceKey([], 'w0')).toBeUndefined();
  });
});
