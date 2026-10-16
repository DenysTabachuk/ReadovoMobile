import type { SelectedTextToken } from '../../types';

const MAX_SELECTED_WORDS = 5;

/**
 * Extend a phrase selection only with adjacent words from the same sentence.
 *
 * Allows at most five words. Returning the existing array for unchanged selection also
 * avoids an unnecessary state update.
 *
 * @param currentSelection - Currently selected tokens.
 * @param nextToken - Word the reader just pressed.
 * @returns The next selection: a new single-word selection for an incompatible word, an
 *   extended array, or the existing array for duplicates or a reached limit.
 * @example
 * const token = { context: 'Hello world.', text: 'Hello', word: 'hello', tokenKey: 'block-0-word-0-0' };
 * resolveNextTokenSelection([], token);
 * // => [token]
 */
export function resolveNextTokenSelection(
  currentSelection: SelectedTextToken[],
  nextToken: SelectedTextToken,
): SelectedTextToken[] {
  if (currentSelection.length === 0) {
    return [nextToken];
  }

  const firstSelectedToken = currentSelection[0];
  const sameSentence = Boolean(
    firstSelectedToken?.sentenceKey &&
    nextToken.sentenceKey &&
    firstSelectedToken.sentenceKey === nextToken.sentenceKey,
  );
  const nextTokenAlreadySelected = currentSelection.some(
    (token) => token.tokenKey === nextToken.tokenKey,
  );

  if (!sameSentence) {
    return [nextToken];
  }

  if (nextTokenAlreadySelected) {
    return currentSelection;
  }

  const selectedIndexes = currentSelection
    .map((token) => token.sentenceWordIndex)
    .filter((index): index is number => typeof index === 'number');
  const nextTokenIndex = nextToken.sentenceWordIndex;

  if (selectedIndexes.length === 0 || typeof nextTokenIndex !== 'number') {
    return [nextToken];
  }

  const minIndex = Math.min(...selectedIndexes);
  const maxIndex = Math.max(...selectedIndexes);
  const isAdjacent =
    nextTokenIndex === minIndex - 1 || nextTokenIndex === maxIndex + 1;

  if (!isAdjacent) {
    return [nextToken];
  }

  if (currentSelection.length >= MAX_SELECTED_WORDS) {
    return currentSelection;
  }

  return [...currentSelection, nextToken];
}
