import { createPlayableChunk } from './index';
import type { ArticleSpeechChunk } from '../../types';

describe('createPlayableChunk', () => {
  const chunk: ArticleSpeechChunk = {
    text: 'Hi all.',
    words: [
      { charStart: 0, charEnd: 2, text: 'Hi', tokenKey: 'w0' },
      { charStart: 3, charEnd: 6, text: 'all', tokenKey: 'w1' },
    ],
  };
  it('resumes at a word and rebases its offsets without changing the source', () => {
    const result = createPlayableChunk(chunk, 1);
    expect(result).toEqual({
      text: 'all.',
      words: [{ charStart: 0, charEnd: 3, text: 'all', tokenKey: 'w1' }],
    });
    expect(chunk.words[1].charStart).toBe(3);
    expect(result.words[0]).not.toBe(chunk.words[1]);
  });
  it('includes the whole chunk from the first word', () => {
    expect(createPlayableChunk(chunk, 0)).toEqual(chunk);
  });
  it('reuses the original reference for unavailable positions and empty chunks', () => {
    expect(createPlayableChunk(chunk, 99)).toBe(chunk);
    expect(createPlayableChunk(chunk, -1)).toBe(chunk);
    const empty = { text: '', words: [] };
    expect(createPlayableChunk(empty, 0)).toBe(empty);
  });
});
