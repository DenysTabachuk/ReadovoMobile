import type { SelectedTextToken } from '../../types';

export type ArticleTranslationState = {
  selectedTokens: SelectedTextToken[];
  isTranslationSheetOpen: boolean;
};

export type ArticleTranslationAction =
  | { type: 'wordPressed'; token: SelectedTextToken }
  | { type: 'sheetOpened' }
  | { type: 'closed' };
