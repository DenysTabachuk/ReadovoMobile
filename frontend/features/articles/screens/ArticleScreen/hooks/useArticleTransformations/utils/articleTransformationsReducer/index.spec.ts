import type { SimplifyArticleResponse } from '@/features/articles/api';
import type { ArticleTransformationsState } from '../../types';
import { articleTransformationsReducer } from './index';

const initialState: ArticleTransformationsState = {
  generatedArticles: {},
  selectedLevel: 'A2',
  selectedTextViewMode: 'original',
  latestGeneratedKey: null,
};
const adaptation: SimplifyArticleResponse = {
  adaptedBlocks: [],
  adaptedLength: 10,
  originalLength: 20,
  level: 'A2',
  title: 'Space',
  transformationType: 'adaptation',
};

describe('articleTransformationsReducer', () => {
  it('selects a generated version without mutating the old state', () => {
    const next = articleTransformationsReducer(initialState, {
      type: 'generated',
      article: adaptation,
    });
    expect(next.selectedTextViewMode).toBe('adaptation');
    expect(next.latestGeneratedKey).toBe('adaptation:A2');
    expect(next.generatedArticles['adaptation:A2']).toBe(adaptation);
    expect(initialState.generatedArticles).toEqual({});
    expect(initialState.selectedTextViewMode).toBe('original');
  });
  it('retains adaptations and summaries across levels and replaces only the matching version', () => {
    let state = articleTransformationsReducer(initialState, {
      type: 'generated',
      article: adaptation,
    });
    const summary = { ...adaptation, transformationType: 'summary' as const };
    const b1 = { ...adaptation, level: 'B1' as const };
    state = articleTransformationsReducer(state, {
      type: 'generated',
      article: summary,
    });
    state = articleTransformationsReducer(state, {
      type: 'generated',
      article: b1,
    });
    const replacement = { ...adaptation, adaptedLength: 15 };
    state = articleTransformationsReducer(state, {
      type: 'generated',
      article: replacement,
    });
    expect(Object.keys(state.generatedArticles)).toEqual([
      'adaptation:A2',
      'summary:A2',
      'adaptation:B1',
    ]);
    expect(state.generatedArticles['adaptation:A2']).toBe(replacement);
    expect(state.generatedArticles['summary:A2']).toBe(summary);
    expect(state.generatedArticles['adaptation:B1']).toBe(b1);
  });
  it('resets the mode on a new level while keeping downloaded versions', () => {
    const generated = articleTransformationsReducer(initialState, {
      type: 'generated',
      article: adaptation,
    });
    const changed = articleTransformationsReducer(generated, {
      type: 'levelChanged',
      level: 'B1',
    });
    expect(changed.selectedLevel).toBe('B1');
    expect(changed.selectedTextViewMode).toBe('original');
    expect(changed.generatedArticles).toBe(generated.generatedArticles);
    expect(
      articleTransformationsReducer(changed, {
        type: 'levelChanged',
        level: 'B1',
      }),
    ).toBe(changed);
  });
  it('does not select a late result for a different level', () => {
    const changed = { ...initialState, selectedLevel: 'B1' as const };
    const next = articleTransformationsReducer(changed, {
      type: 'generated',
      article: adaptation,
    });
    expect(next.selectedTextViewMode).toBe('original');
    expect(next.generatedArticles['adaptation:A2']).toBe(adaptation);
  });
  it('switches modes and preserves state for an unchanged mode', () => {
    const changed = articleTransformationsReducer(initialState, {
      type: 'modeChanged',
      mode: 'summary',
    });
    expect(changed.selectedTextViewMode).toBe('summary');
    expect(
      articleTransformationsReducer(changed, {
        type: 'modeChanged',
        mode: 'summary',
      }),
    ).toBe(changed);
  });
});
