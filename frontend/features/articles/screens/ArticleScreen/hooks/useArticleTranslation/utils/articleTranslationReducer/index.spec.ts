import type { SelectedTextToken } from '../../../../types';
import type { ArticleTranslationState } from '../../types';
import { articleTranslationReducer } from './index';

const first: SelectedTextToken = {
  context: 'Read this article.',
  sentenceKey: 'sentence-0',
  sentenceWordIndex: 0,
  text: 'Read',
  word: 'read',
  tokenKey: 'block-0-word-0-0',
};
const second: SelectedTextToken = {
  ...first,
  sentenceWordIndex: 1,
  text: 'this',
  word: 'this',
  tokenKey: 'block-0-word-0-1',
};
const initialState: ArticleTranslationState = {
  selectedTokens: [],
  isTranslationSheetOpen: false,
};

describe('articleTranslationReducer', () => {
  it('selects the first word without opening the sheet or mutating state', () => {
    const next = articleTranslationReducer(initialState, {
      type: 'wordPressed',
      token: first,
    });
    expect(next).toEqual({
      selectedTokens: [first],
      isTranslationSheetOpen: false,
    });
    expect(initialState).toEqual({
      selectedTokens: [],
      isTranslationSheetOpen: false,
    });
  });

  it('processes consecutive presses using the latest selection and hides an open sheet', () => {
    let state = articleTranslationReducer(initialState, {
      type: 'wordPressed',
      token: first,
    });
    state = articleTranslationReducer(state, { type: 'sheetOpened' });
    const previous = state;
    state = articleTranslationReducer(state, {
      type: 'wordPressed',
      token: second,
    });
    expect(state).toEqual({
      selectedTokens: [first, second],
      isTranslationSheetOpen: false,
    });
    expect(previous.selectedTokens).toEqual([first]);
    expect(previous.isTranslationSheetOpen).toBe(true);
  });

  it('immediately opens the sheet on a selected word without changing selection', () => {
    const selectedTokens = [first, second];
    const next = articleTranslationReducer(
      { selectedTokens, isTranslationSheetOpen: false },
      { type: 'wordPressed', token: first },
    );
    expect(next.isTranslationSheetOpen).toBe(true);
    expect(next.selectedTokens).toBe(selectedTokens);
  });

  it('replaces the selection for a word in another sentence', () => {
    const other = {
      ...second,
      sentenceKey: 'sentence-1',
      tokenKey: 'block-1-word-0-1',
    };
    const next = articleTranslationReducer(
      { selectedTokens: [first], isTranslationSheetOpen: true },
      { type: 'wordPressed', token: other },
    );
    expect(next).toEqual({
      selectedTokens: [other],
      isTranslationSheetOpen: false,
    });
  });

  it('opens after the delay while preserving selection and reuses already-open state', () => {
    const selectedTokens = [first];
    const next = articleTranslationReducer(
      { selectedTokens, isTranslationSheetOpen: false },
      { type: 'sheetOpened' },
    );
    expect(next.isTranslationSheetOpen).toBe(true);
    expect(next.selectedTokens).toBe(selectedTokens);
    expect(articleTranslationReducer(next, { type: 'sheetOpened' })).toBe(next);
  });

  it('clears selection on close and ignores a delayed opening after close', () => {
    const next = articleTranslationReducer(
      { selectedTokens: [first, second], isTranslationSheetOpen: true },
      { type: 'closed' },
    );
    expect(next).toEqual({ selectedTokens: [], isTranslationSheetOpen: false });
    expect(articleTranslationReducer(next, { type: 'sheetOpened' })).toBe(next);
  });
});
