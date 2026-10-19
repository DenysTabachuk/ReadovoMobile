import type { ArticleBlock } from '@/features/articles/api';
import { createVisibleBlockItems } from '../createVisibleBlockItems';
import { resolveArticleScrollIndex } from './index';

describe('resolveArticleScrollIndex', () => {
  const blocks: ArticleBlock[] = [
    { type: 'heading', level: 1, text: 'First' },
    { type: 'paragraph', children: [] },
    { type: 'heading', level: 1, text: 'Second' },
    { type: 'paragraph', children: [] },
  ];

  it('uses list positions after collapsing earlier blocks', () => {
    const items = createVisibleBlockItems(blocks, { 'heading-0-First': true });
    expect(resolveArticleScrollIndex(items, 3)).toBe(2);
    expect(resolveArticleScrollIndex(items, 0)).toBe(0);
  });

  it('finds the target after revealing a collapsed section', () => {
    expect(
      resolveArticleScrollIndex(
        createVisibleBlockItems(blocks, { 'heading-0-First': true }),
        1,
      ),
    ).toBeNull();
    expect(
      resolveArticleScrollIndex(createVisibleBlockItems(blocks, {}), 1),
    ).toBe(1);
  });

  it('returns null for empty lists and absent indexes', () => {
    expect(resolveArticleScrollIndex([], 0)).toBeNull();
    expect(
      resolveArticleScrollIndex(createVisibleBlockItems(blocks, {}), 99),
    ).toBeNull();
  });
});
