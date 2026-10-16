import { hasDuplicateArticleImage } from './index';

describe('hasDuplicateArticleImage', () => {
  it('matches original and differently sized Wikipedia thumbnail URLs', () => {
    expect(
      hasDuplicateArticleImage(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Moon.jpg/200px-Moon.jpg',
        [
          {
            type: 'image',
            src: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Moon.jpg',
          },
        ],
      ),
    ).toBe(true);
  });
  it('normalizes filename case, URL encoding, and resize prefixes', () => {
    expect(
      hasDuplicateArticleImage('https://example.test/200px-The%20Moon.JPG', [
        { type: 'image', src: 'https://example.test/The%20Moon.jpg' },
      ]),
    ).toBe(true);
  });
  it('does not match other images, non-image blocks, empty lists, or empty identities', () => {
    expect(
      hasDuplicateArticleImage('https://example.test/Moon.jpg', [
        { type: 'image', src: 'https://example.test/Sun.jpg' },
      ]),
    ).toBe(false);
    expect(
      hasDuplicateArticleImage('https://example.test/Moon.jpg', [
        { type: 'heading', level: 1, text: 'Moon.jpg' },
      ]),
    ).toBe(false);
    expect(hasDuplicateArticleImage('', [])).toBe(false);
  });
});
