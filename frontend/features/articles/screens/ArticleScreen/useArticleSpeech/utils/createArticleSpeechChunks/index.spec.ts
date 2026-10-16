import { createArticleSpeechChunks } from './index';

jest.mock('expo-speech', () => ({ maxSpeechInputLength: 4000 }));
describe('createArticleSpeechChunks', () => {
  it('combines sections and shifts word offsets into the joined speech text', () => {
    expect(
      createArticleSpeechChunks([
        { type: 'paragraph', children: [{ type: 'word', text: 'Hello' }] },
        { type: 'paragraph', children: [{ type: 'word', text: 'World' }] },
      ]),
    ).toEqual([
      {
        text: 'Hello\n\nWorld',
        words: [
          {
            charStart: 0,
            charEnd: 5,
            text: 'Hello',
            tokenKey: 'block-0-word-0-0',
          },
          {
            charStart: 7,
            charEnd: 12,
            text: 'World',
            tokenKey: 'block-1-word-0-0',
          },
        ],
      },
    ]);
  });
  it('keeps source token keys while measuring offsets against trimmed speech text', () => {
    expect(
      createArticleSpeechChunks([
        { type: 'paragraph', children: [{ type: 'text', text: '  Hello  ' }] },
      ]),
    ).toEqual([
      {
        text: 'Hello',
        words: [
          {
            charStart: 0,
            charEnd: 5,
            text: 'Hello',
            tokenKey: 'block-0-word-1-2',
          },
        ],
      },
    ]);
  });
  it('keeps list-item prefixes and skips nonspoken block types', () => {
    const chunks = createArticleSpeechChunks([
      { type: 'heading', level: 1, text: 'Intro' },
      {
        type: 'list',
        ordered: false,
        items: [
          [{ type: 'word', text: 'First' }],
          [{ type: 'word', text: 'Second' }],
        ],
      },
      { type: 'image', src: 'moon.jpg', alt: 'Moon' },
    ]);
    expect(chunks[0].text).toBe('First\n\nSecond');
    expect(chunks[0].words.map((word) => word.tokenKey)).toEqual([
      'block-1-item-0-word-0-0',
      'block-1-item-1-word-0-0',
    ]);
  });
  it('starts another chunk before appending a section that would exceed the safe limit', () => {
    const section = {
      type: 'paragraph' as const,
      children: [{ type: 'text' as const, text: 'word '.repeat(400).trim() }],
    };
    const chunks = createArticleSpeechChunks([section, section]);
    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.text.length)).toEqual([1999, 1999]);
    expect(chunks[1].words[0]).toMatchObject({
      charStart: 0,
      charEnd: 4,
      tokenKey: 'block-1-word-0-0',
    });
  });
  it('handles missing blocks and blocks without spoken words', () => {
    expect(createArticleSpeechChunks()).toEqual([]);
    expect(createArticleSpeechChunks([])).toEqual([]);
    expect(
      createArticleSpeechChunks([
        { type: 'paragraph', children: [{ type: 'text', text: ' 123 ! ' }] },
      ]),
    ).toEqual([]);
  });
});
