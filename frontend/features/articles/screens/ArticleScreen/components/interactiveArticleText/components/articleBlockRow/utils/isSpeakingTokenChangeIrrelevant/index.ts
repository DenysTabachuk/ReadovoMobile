import { isTokenKeyInsidePrefix } from '../isTokenKeyInsidePrefix';

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
