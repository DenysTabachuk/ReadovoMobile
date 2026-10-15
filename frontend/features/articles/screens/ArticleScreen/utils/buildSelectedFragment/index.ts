import type { SelectedTextToken, SelectedTextFragment } from '../../types';

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
