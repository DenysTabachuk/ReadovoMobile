import {
  useArticleAdaptationsQuery,
  useSimplifyArticleMutation,
  type ArticleTextTransformationType,
  type SimplifyArticleLevel,
  type WikipediaArticleDetail,
} from '@/features/articles/api';
import { stripDuplicateTitleHeading } from '@/features/articles/utils/stripDuplicateTitleHeading';
import { useCallback, useMemo, useReducer } from 'react';
import type { ArticleTextViewMode } from '../../types';
import { createAdaptationKey, isSameAdaptation } from '../../utils';
import { mergeArticleAdaptations } from '../../utils/mergeArticleAdaptations';
import type { ArticleTransformationsState } from './types';
import { articleTransformationsReducer } from './utils/articleTransformationsReducer';

const INITIAL_STATE: ArticleTransformationsState = {
  generatedArticles: {},
  selectedLevel: 'A2',
  selectedTextViewMode: 'original',
  latestGeneratedKey: null,
};

/**
 * Owns text-version selection and generation for one mounted article reader.
 * Changing level selects the original text but retains generated versions by level.
 * Late results for another level are stored without replacing the selected version.
 * The caller must remount the reader when the article changes.
 *
 * @param article - Article whose original and generated versions are displayed.
 * @param onTextChange - Clears external selection on text changes and generation success.
 * @returns Displayed blocks, available versions, generation state, and actions to
 * select a level/version or explicitly generate an adaptation or summary.
 * @example
 * // Inside a component or another hook:
 * const text = useArticleTransformations(article, clearSelection);
 * text.generateTransformation('summary');
 * // Requests a summary for the selected level; selects it on success if that
 * // level is still selected, otherwise retains it for later use.
 */
export function useArticleTransformations(
  article: WikipediaArticleDetail,
  onTextChange: () => void,
) {
  const [state, dispatch] = useReducer(
    articleTransformationsReducer,
    INITIAL_STATE,
  );
  const {
    selectedLevel,
    selectedTextViewMode,
    generatedArticles,
    latestGeneratedKey,
  } = state;
  const { data: articleAdaptationsById = {} } = useArticleAdaptationsQuery(
    article.id,
  );
  const { mutate, isPending, variables } = useSimplifyArticleMutation({
    article,
    selectedLevel,
    onSuccess: (response) => {
      dispatch({ type: 'generated', article: response });
      onTextChange();
    },
  });
  const availableAdaptations = useMemo(
    () =>
      mergeArticleAdaptations(
        articleAdaptationsById[String(article.id)] ?? [],
        Object.values(generatedArticles),
      ),
    [articleAdaptationsById, article.id, generatedArticles],
  );
  const displayedGeneratedArticle =
    selectedTextViewMode === 'original'
      ? null
      : (generatedArticles[
          createAdaptationKey(selectedLevel, selectedTextViewMode)
        ] ?? null);
  const displayedBlocks = useMemo(
    () =>
      displayedGeneratedArticle?.adaptedBlocks ??
      stripDuplicateTitleHeading(article.blocks, article.title),
    [article, displayedGeneratedArticle],
  );

  const handleLevelChange = useCallback(
    (level: SimplifyArticleLevel) => {
      if (level !== selectedLevel) {
        dispatch({ type: 'levelChanged', level });
        onTextChange();
      }
    },
    [selectedLevel, onTextChange],
  );
  const generateTransformation = useCallback(
    (type: ArticleTextTransformationType) => {
      if (!isPending) mutate(type);
    },
    [isPending, mutate],
  );
  const handleTextViewModeChange = useCallback(
    (mode: ArticleTextViewMode) => {
      onTextChange();
      if (
        mode === 'original' ||
        generatedArticles[createAdaptationKey(selectedLevel, mode)]
      ) {
        dispatch({ type: 'modeChanged', mode });
      } else if (
        availableAdaptations.some((adaptation) =>
          isSameAdaptation(adaptation, selectedLevel, mode),
        )
      ) {
        generateTransformation(mode);
      }
    },
    [
      onTextChange,
      generatedArticles,
      selectedLevel,
      availableAdaptations,
      generateTransformation,
    ],
  );

  return {
    selectedLevel,
    selectedTextViewMode,
    displayedBlocks,
    displayedGeneratedArticle,
    latestGeneratedArticle: latestGeneratedKey
      ? generatedArticles[latestGeneratedKey]
      : null,
    availableAdaptations,
    isSelectedAdaptationAvailable: availableAdaptations.some((item) =>
      isSameAdaptation(item, selectedLevel, 'adaptation'),
    ),
    isSelectedSummaryAvailable: availableAdaptations.some((item) =>
      isSameAdaptation(item, selectedLevel, 'summary'),
    ),
    isGenerating: isPending,
    pendingTransformationType: variables,
    handleLevelChange,
    handleTextViewModeChange,
    generateTransformation,
  };
}
