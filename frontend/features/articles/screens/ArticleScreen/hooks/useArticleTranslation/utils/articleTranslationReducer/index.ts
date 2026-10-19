import { resolveNextTokenSelection } from '../../../../utils/resolveNextTokenSelection';
import type {
  ArticleTranslationAction,
  ArticleTranslationState,
} from '../../types';

/**
 * Updates word selection and sheet visibility together without side effects.
 * Pressing a selected word opens the sheet; another word updates the phrase and
 * hides the sheet while the caller schedules its delayed opening.
 *
 * @param state - Current selection and visibility; never mutated.
 * @param action - Word press, delayed sheet opening, or closing/reset action.
 * @returns Next state, retaining the selected-token reference when opening the
 * sheet. A delayed open with no selection is ignored.
 * @example
 * articleTranslationReducer({ selectedTokens: [], isTranslationSheetOpen: false }, { type: 'sheetOpened' });
 * // => { selectedTokens: [], isTranslationSheetOpen: false }
 */
export function articleTranslationReducer(
  state: ArticleTranslationState,
  action: ArticleTranslationAction,
): ArticleTranslationState {
  switch (action.type) {
    case 'wordPressed': {
      if (
        state.selectedTokens.some(
          (token) => token.tokenKey === action.token.tokenKey,
        )
      ) {
        return { ...state, isTranslationSheetOpen: true };
      }
      return {
        selectedTokens: resolveNextTokenSelection(
          state.selectedTokens,
          action.token,
        ),
        isTranslationSheetOpen: false,
      };
    }
    case 'sheetOpened':
      return state.selectedTokens.length === 0 || state.isTranslationSheetOpen
        ? state
        : { ...state, isTranslationSheetOpen: true };
    case 'closed':
      return { selectedTokens: [], isTranslationSheetOpen: false };
  }
}
