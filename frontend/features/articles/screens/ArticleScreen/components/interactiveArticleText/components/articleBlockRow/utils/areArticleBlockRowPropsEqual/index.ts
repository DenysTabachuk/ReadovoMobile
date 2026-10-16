import { type ArticleBlockRowProps } from '../../types';
import { isSpeakingTokenChangeIrrelevant } from '../isSpeakingTokenChangeIrrelevant';
import { isSelectedTokensChangeIrrelevant } from '../isSelectedTokensChangeIrrelevant';

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
