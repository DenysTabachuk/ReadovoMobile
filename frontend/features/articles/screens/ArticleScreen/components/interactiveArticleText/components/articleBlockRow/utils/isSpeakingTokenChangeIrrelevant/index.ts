import { isTokenKeyInsidePrefix } from '../isTokenKeyInsidePrefix';

/**
 * Check whether a speech update can be ignored by a token subtree.
 *
 * Leaving the subtree must trigger a rerender so its old speech highlight is cleared.
 *
 * @param params - Previous and next spoken keys plus the subtree prefix to compare.
 * @returns True if both keys are outside the subtree or unchanged; false when speech
 *   enters, moves within, or leaves it.
 * @example
 * isSpeakingTokenChangeIrrelevant({
 *   prefix: 'block-1', previousSpeakingTokenKey: 'block-2-word-0-0', nextSpeakingTokenKey: 'block-3-word-0-0',
 * });
 * // => true
 */
export function isSpeakingTokenChangeIrrelevant(params: {
  nextSpeakingTokenKey?: string;
  prefix: string;
  previousSpeakingTokenKey?: string;
}): boolean {
  const wasSpeakingInsidePrefix = isTokenKeyInsidePrefix(
    params.previousSpeakingTokenKey,
    params.prefix,
  );
  const isSpeakingInsidePrefix = isTokenKeyInsidePrefix(
    params.nextSpeakingTokenKey,
    params.prefix,
  );

  if (!wasSpeakingInsidePrefix && !isSpeakingInsidePrefix) {
    return true;
  }

  return params.previousSpeakingTokenKey === params.nextSpeakingTokenKey;
}
