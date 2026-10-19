import { TRANSLATION_SHEET_OPEN_DELAY_MS } from '../../constants';
import { useAuth } from '@/features/auth';
import { useCreateDictionaryWordMutation } from '@/features/dictionary';
import { useWordTranslation } from '@/features/translations';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { SelectedTextToken } from '../../types';
import { buildSelectedFragment } from '../../utils';
import type { ArticleTranslationState } from './types';
import { articleTranslationReducer } from './utils/articleTranslationReducer';

const INITIAL_STATE: ArticleTranslationState = {
  selectedTokens: [],
  isTranslationSheetOpen: false,
};

/**
 * Coordinates word selection, translation fetching, and the translation sheet.
 * Selecting words enables the query immediately and schedules the sheet to open;
 * selection changes or unmount clear the pending timer. Saving to the dictionary
 * requires an explicit action, an authenticated user, and an available translation.
 *
 * @returns Selection, translation/loading/error state, sheet visibility, the
 * dictionary mutation, and actions to select, close, or save. Closing clears selection.
 * @example
 * // Inside a component or another hook:
 * const translation = useArticleTranslation();
 * translation.handleCloseTranslation();
 * // Closes the sheet and clears the highlighted words.
 */
export function useArticleTranslation() {
  const { currentUser } = useAuth();
  const [{ selectedTokens, isTranslationSheetOpen }, dispatch] = useReducer(
    articleTranslationReducer,
    INITIAL_STATE,
  );
  const selectedFragment = useMemo(
    () => buildSelectedFragment(selectedTokens),
    [selectedTokens],
  );
  const {
    data: translation,
    error: translationError,
    isFetching: isTranslationLoading,
  } = useWordTranslation({
    context: selectedFragment?.context,
    enabled: selectedTokens.length > 0,
    queryScope: 'article-screen',
    word: selectedFragment?.text,
  });
  const dictionaryMutation = useCreateDictionaryWordMutation();
  const handleWordPress = useCallback((selection: SelectedTextToken) => {
    dispatch({ type: 'wordPressed', token: selection });
  }, []);

  useEffect(() => {
    if (selectedTokens.length === 0 || isTranslationSheetOpen) return;
    const timeout = setTimeout(
      () => dispatch({ type: 'sheetOpened' }),
      TRANSLATION_SHEET_OPEN_DELAY_MS,
    );
    return () => clearTimeout(timeout);
  }, [isTranslationSheetOpen, selectedTokens]);

  const handleCloseTranslation = useCallback(() => {
    dispatch({ type: 'closed' });
  }, []);

  const handleAddToDictionary = useCallback(() => {
    const dictionaryTranslation =
      translation?.baseTranslation ?? translation?.translation;

    if (!currentUser?.id || !selectedFragment || !dictionaryTranslation) {
      return;
    }

    dictionaryMutation.mutate({
      context: selectedFragment.context,
      translation: dictionaryTranslation,
      word: selectedFragment.text,
    });
  }, [
    currentUser?.id,
    dictionaryMutation,
    selectedFragment,
    translation?.baseTranslation,
    translation?.translation,
  ]);

  const selectedTokenKeys = useMemo(
    () => selectedTokens.map((token) => token.tokenKey),
    [selectedTokens],
  );
  return {
    selectedTokens,
    selectedTokenKeys,
    selectedFragment,
    translation,
    translationError,
    isTranslationLoading,
    dictionaryMutation,
    isTranslationSheetOpen,
    handleWordPress,
    handleCloseTranslation,
    handleAddToDictionary,
  };
}
