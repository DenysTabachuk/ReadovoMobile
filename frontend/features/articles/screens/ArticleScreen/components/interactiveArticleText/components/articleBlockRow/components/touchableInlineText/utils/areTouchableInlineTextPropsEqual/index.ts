import { type TouchableInlineTextProps } from '../../types';
import { isSpeakingTokenChangeIrrelevant } from '../../../../utils/isSpeakingTokenChangeIrrelevant';
import { isSelectedTokensChangeIrrelevant } from '../../../../utils/isSelectedTokensChangeIrrelevant';

export function areTouchableInlineTextPropsEqual(
  previousProps: TouchableInlineTextProps,
  nextProps: TouchableInlineTextProps,
): boolean {
  return (
    previousProps.nodes === nextProps.nodes &&
    previousProps.onWordPress === nextProps.onWordPress &&
    previousProps.prefix === nextProps.prefix &&
    previousProps.style === nextProps.style &&
    isSpeakingTokenChangeIrrelevant({
      nextSpeakingTokenKey: nextProps.speakingTokenKey,
      prefix: nextProps.prefix,
      previousSpeakingTokenKey: previousProps.speakingTokenKey,
    }) &&
    isSelectedTokensChangeIrrelevant({
      nextSelectedTokenKeys: nextProps.selectedTokenKeys,
      previousSelectedTokenKeys: previousProps.selectedTokenKeys,
      prefix: nextProps.prefix,
    })
  );
}
