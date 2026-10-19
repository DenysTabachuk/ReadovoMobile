import { createSentenceGroups } from './index';

describe('createSentenceGroups', () => {
  it('handles empty parts', () => {
    expect(createSentenceGroups([])).toEqual([]);
  });
  it('attaches separators to the preceding sentence without mutating the parts', () => {
    const parts: Parameters<typeof createSentenceGroups>[0] = [
      {
        type: 'word',
        key: 'w0',
        text: 'Hello',
        word: 'hello',
        sentenceKey: 's0',
      },
      { type: 'text', key: 't0', text: '. ' },
      { type: 'word', key: 'w1', text: 'Bye', word: 'bye', sentenceKey: 's1' },
    ];
    const result = createSentenceGroups(parts);
    expect(result).toEqual([
      { key: 's0', sentenceKey: 's0', parts: [parts[0], parts[1]] },
      { key: 's1', sentenceKey: 's1', parts: [parts[2]] },
    ]);
    expect(result[0].parts[0]).toBe(parts[0]);
    expect(parts).toHaveLength(3);
  });
  it('keeps leading unassigned text in a separate group', () => {
    const part = { type: 'text' as const, key: 'leading', text: ' ' };
    expect(createSentenceGroups([part])).toEqual([
      { key: 'leading', parts: [part], sentenceKey: undefined },
    ]);
  });
});
