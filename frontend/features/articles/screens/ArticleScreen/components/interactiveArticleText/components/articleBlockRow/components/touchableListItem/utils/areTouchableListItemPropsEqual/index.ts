import { type TouchableListItemProps } from '../../types';
import { isSpeakingTokenChangeIrrelevant } from '../../../../utils/isSpeakingTokenChangeIrrelevant';
import { isSelectedTokensChangeIrrelevant } from '../../../../utils/isSelectedTokensChangeIrrelevant';

export function areTouchableListItemPropsEqual(
  previousProps: TouchableListItemProps,
  nextProps: TouchableListItemProps,
): boolean {
  return (
    previousProps.item === nextProps.item &&
    previousProps.itemIndex === nextProps.itemIndex &&
    previousProps.onWordPress === nextProps.onWordPress &&
    previousProps.ordered === nextProps.ordered &&
    previousProps.prefix === nextProps.prefix &&
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
