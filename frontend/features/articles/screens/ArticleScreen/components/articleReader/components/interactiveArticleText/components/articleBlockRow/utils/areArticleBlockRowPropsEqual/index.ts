import { type ArticleBlockRowProps } from '../../types';
import { isSpeakingTokenChangeIrrelevant } from '../isSpeakingTokenChangeIrrelevant';
import { isSelectedTokensChangeIrrelevant } from '../isSelectedTokensChangeIrrelevant';

/**
 * Decide whether React.memo can reuse a rendered article block.
 *
 * Headings ignore token changes. Other blocks compare only their token prefix; tables use
 * the shared table prefix.
 *
 * @param previousProps - Props used for the previous block render.
 * @param nextProps - Incoming block props.
 * @returns True when the row can be reused; false for relevant content, interaction,
 *   selection, or speech changes.
 * @example
 * const props = {
 *   block: { type: 'paragraph' as const, children: [] }, blockKey: 'block-1', chevronColor: '#000',
 *   onActivateInteractiveBlock: () => {}, onToggleHeading: () => {}, onWordPress: () => {},
 * };
 * areArticleBlockRowPropsEqual(props, props);
 * // => true
 */
export function areArticleBlockRowPropsEqual(
  previousProps: ArticleBlockRowProps,
  nextProps: ArticleBlockRowProps,
): boolean {
  if (
    previousProps.block !== nextProps.block ||
    previousProps.blockKey !== nextProps.blockKey ||
    previousProps.chevronColor !== nextProps.chevronColor ||
    previousProps.collapsed !== nextProps.collapsed ||
    previousProps.onActivateInteractiveBlock !==
      nextProps.onActivateInteractiveBlock ||
    previousProps.onToggleHeading !== nextProps.onToggleHeading ||
    previousProps.onWordPress !== nextProps.onWordPress
  ) {
    return false;
  }

  const wasInteractiveBlock =
    previousProps.activeInteractiveBlockKey === previousProps.blockKey;
  const isInteractiveBlock =
    nextProps.activeInteractiveBlockKey === nextProps.blockKey;

  if (wasInteractiveBlock !== isInteractiveBlock) {
    return false;
  }

  if (nextProps.block.type === 'heading') {
    // Headings have no selectable or spoken tokens, so token updates cannot alter them.
    return true;
  }

  const tokenPrefix = getArticleBlockTokenPrefix(nextProps);

  return (
    isSpeakingTokenChangeIrrelevant({
      nextSpeakingTokenKey: nextProps.speakingTokenKey,
      prefix: tokenPrefix,
      previousSpeakingTokenKey: previousProps.speakingTokenKey,
    }) &&
    isSelectedTokensChangeIrrelevant({
      nextSelectedTokenKeys: nextProps.selectedTokenKeys,
      previousSelectedTokenKeys: previousProps.selectedTokenKeys,
      prefix: tokenPrefix,
    })
  );
}

function getArticleBlockTokenPrefix(props: ArticleBlockRowProps): string {
  return props.block.type === 'table' ? 'table' : props.blockKey;
}
