import { type ArticleBlock } from '@/features/articles/api';
import { type InteractiveArticleTextProps } from '../../types';

export type ArticleBlockRowProps = {
  activeInteractiveBlockKey?: string;
  block: ArticleBlock;
  blockKey: string;
  chevronColor: string;
  collapsed?: boolean;
  onActivateInteractiveBlock: (blockKey: string) => void;
  onToggleHeading: (headingKey: string) => void;
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
};
