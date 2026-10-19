import type { ArticleBlockRowProps } from '../../types';

import { areArticleBlockRowPropsEqual } from './index';

const props: ArticleBlockRowProps = {
  block: { type: 'paragraph', children: [{ type: 'word', text: 'Hello' }] },
  blockKey: 'block-1',
  chevronColor: '#000',
  onActivateInteractiveBlock: () => undefined,
  onToggleHeading: () => undefined,
  onWordPress: () => undefined,
};

describe('areArticleBlockRowPropsEqual', () => {
  it('invalidates changed block content, callbacks, and collapse state', () => {
    expect(
      areArticleBlockRowPropsEqual(props, {
        ...props,
        block: { ...props.block },
      }),
    ).toBe(false);
    expect(
      areArticleBlockRowPropsEqual(props, {
        ...props,
        onWordPress: () => undefined,
      }),
    ).toBe(false);
    expect(
      areArticleBlockRowPropsEqual(props, { ...props, collapsed: true }),
    ).toBe(false);
  });

  it('ignores token updates for headings', () => {
    const headingProps: ArticleBlockRowProps = {
      ...props,
      block: { type: 'heading', level: 1, text: 'Intro' },
    };
    expect(
      areArticleBlockRowPropsEqual(headingProps, {
        ...headingProps,
        speakingTokenKey: 'block-1-word-0-0',
        selectedTokenKeys: ['block-1-word-0-0'],
      }),
    ).toBe(true);
  });
  it('skips rerendering when speech moves between other blocks', () => {
    expect(
      areArticleBlockRowPropsEqual(
        { ...props, speakingTokenKey: 'block-2-word-0-0' },
        { ...props, speakingTokenKey: 'block-3-word-0-0' },
      ),
    ).toBe(true);
  });

  it('rerenders when speech leaves this block so its highlight can be cleared', () => {
    expect(
      areArticleBlockRowPropsEqual(
        { ...props, speakingTokenKey: 'block-1-word-0-0' },
        { ...props, speakingTokenKey: 'block-2-word-0-0' },
      ),
    ).toBe(false);
  });

  it('rerenders when this block becomes interactive', () => {
    expect(
      areArticleBlockRowPropsEqual(props, {
        ...props,
        activeInteractiveBlockKey: 'block-1',
      }),
    ).toBe(false);
  });

  it('uses the table token prefix to detect selection changes', () => {
    const tableProps: ArticleBlockRowProps = {
      ...props,
      block: { type: 'table', rows: [] },
    };

    expect(
      areArticleBlockRowPropsEqual(tableProps, {
        ...tableProps,
        selectedTokenKeys: ['table-row-0-cell-0-word-0-0'],
      }),
    ).toBe(false);
    expect(
      areArticleBlockRowPropsEqual(tableProps, {
        ...tableProps,
        selectedTokenKeys: ['block-2-word-0-0'],
      }),
    ).toBe(true);
  });
});
