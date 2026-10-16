import { createInlineNodesFromPlainText } from './index';

describe('createInlineNodesFromPlainText', () => {
  it('preserves exact spacing and punctuation', () => {
    expect(createInlineNodesFromPlainText(' Hi, world!')).toEqual([
      { type: 'text', text: ' ' },
      { type: 'word', text: 'Hi' },
      { type: 'text', text: ', ' },
      { type: 'word', text: 'world' },
      { type: 'text', text: '!' },
    ]);
  });
  it('keeps contractions and hyphenated words together', () => {
    expect(
      createInlineNodesFromPlainText("don't mother-in-law it’s")
        .filter((node) => node.type === 'word')
        .map((node) => node.text),
    ).toEqual(["don't", 'mother-in-law', 'it’s']);
  });
  it('preserves unsupported scripts as text and handles empty input', () => {
    expect(createInlineNodesFromPlainText('Привіт!')).toEqual([
      { type: 'text', text: 'Привіт!' },
    ]);
    expect(createInlineNodesFromPlainText('')).toEqual([]);
  });
});
