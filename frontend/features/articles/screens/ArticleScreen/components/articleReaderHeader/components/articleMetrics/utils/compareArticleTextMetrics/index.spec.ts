import type { ArticleBlock } from '@/features/articles/api';
import { compareArticleTextMetrics } from './index';

describe('compareArticleTextMetrics', () => {
  it('compares the original and readable transformed text without modifying blocks', () => {
    const blocks: ArticleBlock[] = [
      { type: 'paragraph', children: [{ type: 'text', text: 'Hi.' }] },
    ];
    expect(compareArticleTextMetrics('Hi all.', blocks)).toEqual({
      original: {
        averageSentenceWords: 2,
        averageWordLength: 2.5,
        characterCount: 7,
        sentenceCount: 1,
        wordCount: 2,
      },
      adapted: {
        averageSentenceWords: 1,
        averageWordLength: 2,
        characterCount: 3,
        sentenceCount: 1,
        wordCount: 1,
      },
    });
    expect(blocks).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'Hi.' }] },
    ]);
  });
  it('handles empty texts', () => {
    const metrics = compareArticleTextMetrics('', []);
    expect(metrics.original).toEqual({
      averageSentenceWords: 0,
      averageWordLength: 0,
      characterCount: 0,
      sentenceCount: 0,
      wordCount: 0,
    });
    expect(metrics.adapted).toEqual(metrics.original);
  });
});
