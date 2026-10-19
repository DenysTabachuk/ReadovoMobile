import { type InlineNode } from '@/features/articles/api';
import { type StyleProp, type TextStyle } from 'react-native';
import { type InteractiveArticleTextProps } from '../../../../types';

export type TouchableInlineTextProps = {
  nodes: InlineNode[];
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
  style: StyleProp<TextStyle>;
};
