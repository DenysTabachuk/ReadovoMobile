import { createPlainTextSegments } from './index';

describe('createPlainTextSegments', () => {
  it('returns no segments for empty input', () => {
    expect(createPlainTextSegments([])).toEqual([]);
  });
  it('merges adjacent word/text nodes with equivalent emphasis without mutating them', () => {
    const nodes: Parameters<typeof createPlainTextSegments>[0] = [
      { type: 'word', text: 'Hello' },
      { type: 'text', text: ' world', bold: false, italic: false },
    ];
    expect(createPlainTextSegments(nodes)).toEqual([
      {
        key: 'plain-0',
        text: 'Hello world',
        bold: undefined,
        italic: undefined,
      },
    ]);
    expect(nodes.map((node) => node.text)).toEqual(['Hello', ' world']);
  });
  it('keeps formatting boundaries and keys from the first original node', () => {
    expect(
      createPlainTextSegments([
        { type: 'word', text: 'A', bold: true },
        { type: 'text', text: 'B', bold: true },
        { type: 'word', text: 'C', italic: true },
        { type: 'word', text: 'D', bold: true },
      ]),
    ).toEqual([
      { key: 'plain-0', text: 'AB', bold: true, italic: undefined },
      { key: 'plain-2', text: 'C', bold: undefined, italic: true },
      { key: 'plain-3', text: 'D', bold: true, italic: undefined },
    ]);
  });
});
