import { type TouchableListItemProps } from '../../types';
import { isSpeakingTokenChangeIrrelevant } from '../../../../utils/isSpeakingTokenChangeIrrelevant';
import { isSelectedTokensChangeIrrelevant } from '../../../../utils/isSelectedTokensChangeIrrelevant';

/**
 * Decide whether React.memo can reuse an interactive list item.
 *
 * Speech and selection changes outside this item are ignored to avoid rerendering every
 * list item.
 *
 * @param previousProps - Props used for the previous render.
 * @param nextProps - Incoming list item props.
 * @returns True when content references, list position, callbacks, and relevant token state
 *   match.
 * @example
 * const props = { item: [], itemIndex: 0, ordered: false, prefix: 'block-1-item-0', onWordPress: () => {} };
 * areTouchableListItemPropsEqual(props, props);
 * // => true
 */
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
