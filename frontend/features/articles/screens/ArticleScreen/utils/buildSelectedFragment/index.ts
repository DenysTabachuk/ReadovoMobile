import type { SelectedTextToken, SelectedTextFragment } from '../../types';

/**
 * Assemble selected tokens into the phrase sent to translation and the dictionary.
 *
 * Sorts a copy by sentence word index, preserving the input array. The caller is
 * responsible for selection adjacency.
 *
 * @param selectedTokens - Tokens from a valid single-sentence selection.
 * @returns A phrase with ordered token keys, normalized words, and trimmed context; null
 *   when selection, text, or context is empty.
 * @example
 * buildSelectedFragment([{ context: 'Hello world.', text: 'Hello', word: 'hello', tokenKey: 'block-0-word-0-0' }]);
 * // => { context: 'Hello world.', text: 'Hello', tokenKeys: ['block-0-word-0-0'], words: ['hello'] }
 */
export function buildSelectedFragment(
  selectedTokens: SelectedTextToken[],
): SelectedTextFragment | null {
  if (selectedTokens.length === 0) {
    return null;
  }

  const sortedTokens = [...selectedTokens].sort((leftToken, rightToken) => {
    return (
      (leftToken.sentenceWordIndex ?? 0) - (rightToken.sentenceWordIndex ?? 0)
    );
  });

  const context = sortedTokens[0]?.context?.trim() ?? '';
  const words = sortedTokens.map((token) => token.word);
  const text = sortedTokens
    .map((token) => token.text)
    .join(' ')
    .trim();

  if (!text || !context) {
    return null;
  }

  return {
    context,
    text,
    tokenKeys: sortedTokens.map((token) => token.tokenKey),
    words,
  };
}
