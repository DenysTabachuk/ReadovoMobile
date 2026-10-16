import { createArticlePreviewFromDetail } from './index';

describe('createArticlePreviewFromDetail', () => {
  it('keeps preview metadata and derives a compact extract without mutating detail', () => {
    const detail = {
      id: 42,
      title: 'Space',
      content: '  Hello\n world!  ',
      url: 'https://example.test/42',
      thumbnailUrl: 'moon.jpg',
      blocks: [],
    };
    expect(createArticlePreviewFromDetail(detail)).toEqual({
      id: 42,
      title: 'Space',
      extract: 'Hello world!',
      url: 'https://example.test/42',
      thumbnailUrl: 'moon.jpg',
    });
    expect(detail.content).toBe('  Hello\n world!  ');
  });
  it('handles missing optional images and empty content', () => {
    expect(
      createArticlePreviewFromDetail({
        id: 7,
        title: 'Empty',
        content: '',
        url: 'empty',
        blocks: [],
      }),
    ).toEqual({
      id: 7,
      title: 'Empty',
      extract: '',
      url: 'empty',
      thumbnailUrl: undefined,
    });
  });
});
