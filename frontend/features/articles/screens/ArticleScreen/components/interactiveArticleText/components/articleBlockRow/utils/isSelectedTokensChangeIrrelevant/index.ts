import { isTokenKeyInsidePrefix } from '../isTokenKeyInsidePrefix';

/**
 * Check whether a selection update can be ignored by a token subtree.
 *
 * Used by memo comparators to skip updates from other blocks. Key order is significant.
 *
 * @param params - Previous and next selected keys plus the subtree prefix to compare.
 * @returns True when both selections have the same ordered keys inside the prefix,
 *   including when neither has any.
 * @example
 * isSelectedTokensChangeIrrelevant({
 *   prefix: 'block-1', previousSelectedTokenKeys: ['block-2-word-0-0'], nextSelectedTokenKeys: [],
 * });
 * // => true
 */
export function isSelectedTokensChangeIrrelevant(params: {
  nextSelectedTokenKeys?: string[];
  prefix: string;
  previousSelectedTokenKeys?: string[];
}): boolean {
  const previousSelectionKeysInPrefix = (
    params.previousSelectedTokenKeys ?? []
  ).filter((tokenKey) => isTokenKeyInsidePrefix(tokenKey, params.prefix));
  const nextSelectionKeysInPrefix = (params.nextSelectedTokenKeys ?? []).filter(
    (tokenKey) => isTokenKeyInsidePrefix(tokenKey, params.prefix),
  );

  if (
    previousSelectionKeysInPrefix.length === 0 &&
    nextSelectionKeysInPrefix.length === 0
  ) {
    return true;
  }

  if (
    previousSelectionKeysInPrefix.length !== nextSelectionKeysInPrefix.length
  ) {
    return false;
  }

  return previousSelectionKeysInPrefix.every(
    (tokenKey, index) => tokenKey === nextSelectionKeysInPrefix[index],
  );
}
