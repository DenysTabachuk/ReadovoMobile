import { normalizeInlineNodesForWordSelection } from './index';

describe('normalizeInlineNodesForWordSelection', () => {
  it('preserves emphasis while splitting a sentence into selectable words', () => {
    const node = {
      type: 'text' as const,
      text: 'Hi, world!',
      bold: true,
      italic: true,
    };
    const result = normalizeInlineNodesForWordSelection([node]);
    expect(result).toEqual([
      { type: 'word', text: 'Hi', bold: true, italic: true },
      { type: 'text', text: ', ', bold: true, italic: true },
      { type: 'word', text: 'world', bold: true, italic: true },
      { type: 'text', text: '!', bold: true, italic: true },
    ]);
    expect(node.text).toBe('Hi, world!');
  });
  it('reuses existing word nodes and preserves unrecognized text without mutating input', () => {
    const word = { type: 'word' as const, text: 'Hello' };
    const text = { type: 'text' as const, text: '123 !' };
    const nodes = [word, text];
    const result = normalizeInlineNodesForWordSelection(nodes);
    expect(result).not.toBe(nodes);
    expect(result[0]).toBe(word);
    expect(result[1]).toMatchObject(text);
    expect(normalizeInlineNodesForWordSelection([])).toEqual([]);
  });
});
