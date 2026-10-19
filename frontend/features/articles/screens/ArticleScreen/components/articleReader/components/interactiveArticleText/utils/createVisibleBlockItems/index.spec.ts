import type { ArticleBlock } from '@/features/articles/api';

import { createVisibleBlockItems } from './index';

const blocks: ArticleBlock[] = [
  { type: 'heading', level: 1, text: 'First section' },
  { type: 'paragraph', children: [{ type: 'word', text: 'First' }] },
  { type: 'heading', level: 2, text: 'Nested section' },
  { type: 'paragraph', children: [{ type: 'word', text: 'Nested' }] },
  { type: 'heading', level: 1, text: 'Second section' },
  { type: 'paragraph', children: [{ type: 'word', text: 'Second' }] },
];

describe('createVisibleBlockItems', () => {
  it('handles empty articles and retains every block when nothing is collapsed', () => {
    expect(createVisibleBlockItems([], {})).toEqual([]);
    expect(
      createVisibleBlockItems(blocks, {}).map((item) => item.sourceIndex),
    ).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('hides nested sections while retaining the next sibling section and source indexes', () => {
    const visible = createVisibleBlockItems(blocks, {
      'heading-0-First section': true,
    });

    expect(visible.map(({ sourceIndex }) => sourceIndex)).toEqual([0, 4, 5]);
    expect(visible[2].key).toBe('block-5');
    expect(visible[2].block).toBe(blocks[5]);
  });

  it('preserves a nested section collapse when its parent is reopened', () => {
    const visible = createVisibleBlockItems(blocks, {
      'heading-0-First section': false,
      'heading-2-Nested section': true,
    });

    expect(visible.map(({ sourceIndex }) => sourceIndex)).toEqual([
      0, 1, 2, 4, 5,
    ]);
  });

  it('keeps token prefixes stable across collapse and expansion', () => {
    const expanded = createVisibleBlockItems(blocks, {});
    const collapsed = createVisibleBlockItems(blocks, {
      'heading-0-First section': true,
    });

    for (const item of collapsed) {
      expect(item.key).toBe(expanded[item.sourceIndex].key);
    }
  });
});
