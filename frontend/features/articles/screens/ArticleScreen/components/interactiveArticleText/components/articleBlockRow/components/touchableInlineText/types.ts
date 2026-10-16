import { type InlineNode } from '@/features/articles/api/wikipedia';
import { type InteractiveArticleTextProps } from '../../../../types';
import { type StyleProp, type TextStyle } from 'react-native';

export type TouchableInlineTextProps = {
  nodes: InlineNode[];
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
  style: StyleProp<TextStyle>;
};
