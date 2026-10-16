import { type ArticleBlock } from '@/features/articles/api/wikipedia';
import {
  type StyleProp,
  type ViewStyle,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type FlatList,
} from 'react-native';
import { type ReactElement, type RefObject } from 'react';

export type TouchableTextPart =
  | {
      bold?: boolean;
      italic?: boolean;
      key: string;
      text: string;
      type: 'text';
    }
  | {
      bold?: boolean;
      contextSentence?: string;
      italic?: boolean;
      key: string;
      sentenceKey?: string;
      sentenceWordIndex?: number;
      text: string;
      type: 'word';
      word: string;
    };

export type InteractiveArticleTextProps = {
  blocks?: ArticleBlock[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  ListHeaderComponent?: ReactElement | null;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onVisibleBlockIndexChange?: (sourceIndex: number) => void;
  onVisibleBlockRangeChange?: (range: {
    firstSourceIndex: number;
    lastSourceIndex: number;
  }) => void;
  onWordPress: (selection: {
    context: string;
    sentenceKey?: string;
    sentenceWordIndex?: number;
    text: string;
    tokenKey: string;
    word: string;
  }) => void;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
  scrollEventThrottle?: number;
  scrollRef?: RefObject<FlatList<ArticleBlockListItem> | null>;
  text?: string;
};

export type ArticleBlockListItem = {
  block: ArticleBlock;
  key: string;
  sourceIndex: number;
};
