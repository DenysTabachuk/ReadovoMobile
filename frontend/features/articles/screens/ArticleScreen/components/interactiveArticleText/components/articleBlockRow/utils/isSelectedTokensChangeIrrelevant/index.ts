import { isTokenKeyInsidePrefix } from '../isTokenKeyInsidePrefix';

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
