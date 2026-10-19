import { type TouchableInlineTextProps } from '../../types';
import { isSpeakingTokenChangeIrrelevant } from '../../../../utils/isSpeakingTokenChangeIrrelevant';
import { isSelectedTokensChangeIrrelevant } from '../../../../utils/isSelectedTokensChangeIrrelevant';

/**
 * Decide whether React.memo can reuse interactive inline text.
 *
 * Changes confined to other token prefixes are ignored so speech and selection elsewhere do
 * not rerender this text.
 *
 * @param previousProps - Props used for the previous render.
 * @param nextProps - Incoming props to compare against the previous render.
 * @returns True when references and relevant selection/speech state are unchanged; false
 *   when a rerender is needed.
 * @example
 * const props = { nodes: [], prefix: 'block-1', style: {}, onWordPress: () => {} };
 * areTouchableInlineTextPropsEqual(props, props);
 * // => true
 */
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
