import { createAdaptationKey } from '../../../../utils';
import type {
  ArticleTransformationsAction,
  ArticleTransformationsState,
} from '../../types';

/**
 * Update the selected article version and retain generated versions for every level.
 *
 * @param state - Current reader state, which is never mutated.
 * @param action - Generation result, level selection, or text-mode selection.
 * @returns The next state. Same-level/mode selections reuse state; a late response
 *   for another level is cached without replacing the visible text.
 * @example
 * articleTransformationsReducer({ generatedArticles: {}, selectedLevel: 'A2', selectedTextViewMode: 'original', latestGeneratedKey: null }, { type: 'levelChanged', level: 'B1' }).selectedLevel;
 * // => 'B1'
 */
export function articleTransformationsReducer(
  state: ArticleTransformationsState,
  action: ArticleTransformationsAction,
): ArticleTransformationsState {
  switch (action.type) {
    case 'generated': {
      const key = createAdaptationKey(
        action.article.level,
        action.article.transformationType,
      );
      return {
        ...state,
        generatedArticles: {
          ...state.generatedArticles,
          [key]: action.article,
        },
        latestGeneratedKey: key,
        selectedTextViewMode:
          action.article.level === state.selectedLevel
            ? action.article.transformationType
            : state.selectedTextViewMode,
      };
    }
    case 'levelChanged':
      return action.level === state.selectedLevel
        ? state
        : {
            ...state,
            selectedLevel: action.level,
            selectedTextViewMode: 'original',
          };
    case 'modeChanged':
      return action.mode === state.selectedTextViewMode
        ? state
        : { ...state, selectedTextViewMode: action.mode };
  }
}
