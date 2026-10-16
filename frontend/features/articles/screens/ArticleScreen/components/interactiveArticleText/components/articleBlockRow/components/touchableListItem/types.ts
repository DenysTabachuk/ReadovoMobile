import { type InlineNode } from '@/features/articles/api/wikipedia';
import { type InteractiveArticleTextProps } from '../../../../types';

export type TouchableListItemProps = {
  item: InlineNode[];
  itemIndex: number;
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  ordered: boolean;
  prefix: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
};
