import { type InlineNode } from '@/features/articles/api/wikipedia';
import { type StyleProp, type TextStyle } from 'react-native';

export type PlainInlineTextProps = {
  nodes: InlineNode[];
  onPress?: () => void;
  prefix: string;
  speakingTokenKey?: string;
  style: StyleProp<TextStyle>;
};
