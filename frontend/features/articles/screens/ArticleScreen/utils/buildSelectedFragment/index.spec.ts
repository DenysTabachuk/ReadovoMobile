import { buildSelectedFragment } from './index';

describe('buildSelectedFragment', () => {
  it('sorts tokens by sentence position without reordering input', () => {
    const later = {
      tokenKey: 'w1',
      word: 'world',
      text: 'world',
      sentenceWordIndex: 1,
      context: 'Hello world.',
    };
    const earlier = {
      tokenKey: 'w0',
      word: 'hello',
      text: 'Hello',
      sentenceWordIndex: 0,
      context: '  Hello world.  ',
    };
    const input = [later, earlier];
    expect(buildSelectedFragment(input)).toEqual({
      context: 'Hello world.',
      text: 'Hello world',
      tokenKeys: ['w0', 'w1'],
      words: ['hello', 'world'],
    });
    expect(input).toEqual([later, earlier]);
  });
  it('rejects empty selections or selections without usable text/context', () => {
    expect(buildSelectedFragment([])).toBeNull();
    expect(
      buildSelectedFragment([
        { tokenKey: 'w0', word: 'hello', text: 'Hello', context: ' ' },
      ]),
    ).toBeNull();
    expect(
      buildSelectedFragment([
        { tokenKey: 'w0', word: '', text: ' ', context: 'Hello world.' },
      ]),
    ).toBeNull();
  });
});
