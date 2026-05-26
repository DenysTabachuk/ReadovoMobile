import { Ionicons } from '@expo/vector-icons';
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from 'react';
import {
  FlatList,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  Pressable,
  View,
  type ListRenderItem,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  type ArticleBlock,
  type InlineNode,
  type TableCell,
} from '@/api/wikipedia';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { ArticleFormulaBlock } from '../articleFormulaBlock';
import { ArticleImageBlock } from '../articleImageBlock';
import { ArticleTableBlock } from '../articleTableBlock';
import { TouchableWord } from '../touchableWord';
import { styles } from './styles';
import {
  splitTextToTouchableParts,
  type TouchableTextPart,
} from './textParts';

type InteractiveArticleTextProps = {
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

type ArticleBlockListItem = {
  block: ArticleBlock;
  key: string;
  sourceIndex: number;
};

type TouchableInlineTextProps = {
  nodes: InlineNode[];
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
  style: StyleProp<TextStyle>;
};

type PlainInlineTextProps = {
  nodes: InlineNode[];
  onPress?: () => void;
  prefix: string;
  speakingTokenKey?: string;
  style: StyleProp<TextStyle>;
};

type TouchableListItemProps = {
  item: InlineNode[];
  itemIndex: number;
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  ordered: boolean;
  prefix: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
};

type ArticleBlockRowProps = {
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

type PlainTextSegment = {
  bold?: boolean;
  italic?: boolean;
  key: string;
  text: string;
};

type PlainSentenceGroup = {
  key: string;
  parts: TouchableTextPart[];
  sentenceKey?: string;
};

type TouchableTextSentenceGroup = {
  key: string;
  parts: TouchableTextPart[];
  sentenceKey?: string;
};

const LIST_ITEM_PATTERN = /^([*#-]+|[\u2022\u25cf\u25aa\u25e6]+|[A-Za-z0-9]+[.)])\s*(.*)$/;
const SECTION_HEADING_PATTERN = /^(={2,})\s*(.*?)\s*\1$/;

// Keep a larger plain-text window mounted so fast scrolls do not reveal batched cells.
const INITIAL_RENDER_BLOCK_COUNT = 18;
const MAX_RENDER_BATCH_SIZE = 24;
const RENDER_BATCH_INTERVAL_MS = 16;
const VIRTUALIZED_WINDOW_SIZE = 13;
const ENABLE_SPEECH_SENTENCE_HIGHLIGHT = true;
const ENABLE_SPEECH_WORD_HIGHLIGHT = false;

export function InteractiveArticleText({
  blocks,
  contentContainerStyle,
  ListHeaderComponent,
  onScroll,
  onVisibleBlockIndexChange,
  onVisibleBlockRangeChange,
  onWordPress,
  scrollEventThrottle = 16,
  scrollRef,
  selectedTokenKeys,
  speakingTokenKey,
  text,
}: InteractiveArticleTextProps) {
  const [activeInteractiveBlockKey, setActiveInteractiveBlockKey] = useState<
    string | undefined
  >();
  const [collapsedHeadings, setCollapsedHeadings] = useState<Record<string, boolean>>({});
  const onVisibleBlockIndexChangeRef = useRef(onVisibleBlockIndexChange);
  const onVisibleBlockRangeChangeRef = useRef(onVisibleBlockRangeChange);
  const chevronColor = useThemeColor({ dark: '#9ba1a6', light: '#687076' }, 'icon');
  const resolvedBlocks = useMemo(() => {
    if (blocks && blocks.length > 0) {
      return blocks;
    }

    return parsePlainTextToBlocks(text ?? '');
  }, [blocks, text]);
  const visibleBlockItems = useMemo(() => {
    const activeCollapsedLevels: number[] = [];
    const items: ArticleBlockListItem[] = [];

    resolvedBlocks.forEach((block, index) => {
      if (block.type === 'heading') {
        for (
          let levelIndex = activeCollapsedLevels.length - 1;
          levelIndex >= 0;
          levelIndex -= 1
        ) {
          if (activeCollapsedLevels[levelIndex] >= block.level) {
            activeCollapsedLevels.splice(levelIndex, 1);
          }
        }

        const isHiddenByAncestor = activeCollapsedLevels.length > 0;
        const headingKey = createHeadingKey(block, index);
        const isCollapsed = Boolean(collapsedHeadings[headingKey]);

        if (isCollapsed) {
          activeCollapsedLevels.push(block.level);
        }

        if (!isHiddenByAncestor) {
          items.push({
            block,
            key: headingKey,
            sourceIndex: index,
          });
        }

        return;
      }

      if (activeCollapsedLevels.length > 0) {
        return;
      }

      items.push({
        block,
        key: `block-${index}`,
        sourceIndex: index,
      });
    });

    return items;
  }, [collapsedHeadings, resolvedBlocks]);

  const handleToggleHeading = useCallback((headingKey: string) => {
    setCollapsedHeadings((current) => ({
      ...current,
      [headingKey]: !current[headingKey],
    }));
  }, []);
  const handleActivateInteractiveBlock = useCallback((blockKey: string) => {
    setActiveInteractiveBlockKey(blockKey);
  }, []);
  useEffect(() => {
    onVisibleBlockIndexChangeRef.current = onVisibleBlockIndexChange;
  }, [onVisibleBlockIndexChange]);
  useEffect(() => {
    onVisibleBlockRangeChangeRef.current = onVisibleBlockRangeChange;
  }, [onVisibleBlockRangeChange]);
  const renderItem = useCallback<ListRenderItem<ArticleBlockListItem>>(
    ({ item }) => {
      return (
        <ArticleBlockRow
          activeInteractiveBlockKey={activeInteractiveBlockKey}
          block={item.block}
          blockKey={item.key}
          chevronColor={chevronColor}
          collapsed={Boolean(collapsedHeadings[item.key])}
          onActivateInteractiveBlock={handleActivateInteractiveBlock}
          onToggleHeading={handleToggleHeading}
          onWordPress={onWordPress}
          selectedTokenKeys={selectedTokenKeys}
          speakingTokenKey={
            ENABLE_SPEECH_SENTENCE_HIGHLIGHT || ENABLE_SPEECH_WORD_HIGHLIGHT
              ? speakingTokenKey
              : undefined
          }
        />
      );
    },
    [
      activeInteractiveBlockKey,
      chevronColor,
      collapsedHeadings,
      handleActivateInteractiveBlock,
      handleToggleHeading,
      onWordPress,
      selectedTokenKeys,
      speakingTokenKey,
    ],
  );
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 35,
    minimumViewTime: 80,
  }).current;
  const handleViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{
        index: number | null;
        item?: ArticleBlockListItem;
      }>;
    }) => {
      const sortedVisibleItems = viewableItems
        .filter((viewableItem) => viewableItem.index !== null)
        .sort((leftItem, rightItem) => (leftItem.index ?? 0) - (rightItem.index ?? 0));
      const firstVisibleItem = sortedVisibleItems[0]?.item;
      const lastVisibleItem = sortedVisibleItems[sortedVisibleItems.length - 1]?.item;

      if (typeof firstVisibleItem?.sourceIndex === 'number') {
        onVisibleBlockIndexChangeRef.current?.(firstVisibleItem.sourceIndex);
      }

      if (
        typeof firstVisibleItem?.sourceIndex === 'number' &&
        typeof lastVisibleItem?.sourceIndex === 'number'
      ) {
        onVisibleBlockRangeChangeRef.current?.({
          firstSourceIndex: firstVisibleItem.sourceIndex,
          lastSourceIndex: lastVisibleItem.sourceIndex,
        });
      }
    },
  ).current;

  return (
    <FlatList
      ref={scrollRef}
      data={visibleBlockItems}
      initialNumToRender={INITIAL_RENDER_BLOCK_COUNT}
      keyExtractor={(item) => item.key}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={ListHeaderComponent}
      maxToRenderPerBatch={MAX_RENDER_BATCH_SIZE}
      onScroll={onScroll}
      onViewableItemsChanged={handleViewableItemsChanged}
      onScrollToIndexFailed={(info) => {
        scrollRef?.current?.scrollToOffset({
          animated: true,
          offset: Math.max(0, info.averageItemLength * info.index),
        });
      }}
      renderItem={renderItem}
      removeClippedSubviews={false}
      scrollEventThrottle={scrollEventThrottle}
      showsVerticalScrollIndicator={false}
      style={styles.container}
      updateCellsBatchingPeriod={RENDER_BATCH_INTERVAL_MS}
      viewabilityConfig={viewabilityConfig}
      windowSize={VIRTUALIZED_WINDOW_SIZE}
      contentContainerStyle={contentContainerStyle}
    />
  );
}

const ArticleBlockRow = memo(function ArticleBlockRow({
  activeInteractiveBlockKey,
  block,
  blockKey,
  chevronColor,
  collapsed = false,
  onActivateInteractiveBlock,
  onToggleHeading,
  onWordPress,
  selectedTokenKeys,
  speakingTokenKey,
}: ArticleBlockRowProps) {
  const handleToggleHeading = useCallback(() => {
    onToggleHeading(blockKey);
  }, [blockKey, onToggleHeading]);
  const handleActivateInteractiveBlock = useCallback(() => {
    onActivateInteractiveBlock(blockKey);
  }, [blockKey, onActivateInteractiveBlock]);
  const isInteractiveBlock = activeInteractiveBlockKey === blockKey;

  if (block.type === 'heading') {
    return (
      <Pressable onPress={handleToggleHeading} style={styles.collapsibleHeading}>
        <ThemedText
          style={[
            styles.heading,
            block.level === 1 ? styles.headingLevel1 : null,
            block.level === 2 ? styles.headingLevel2 : null,
            block.level === 3 ? styles.headingLevel3 : null,
          ]}
          type={getHeadingTypographyType(block.level)}>
          {block.text}
        </ThemedText>
        <Ionicons
          color={chevronColor}
          name="chevron-down"
          size={18}
          style={collapsed ? null : styles.collapsibleArrowExpanded}
        />
      </Pressable>
    );
  }

  if (block.type === 'paragraph') {
    if (!isInteractiveBlock) {
      return (
          <PlainInlineText
            nodes={block.children}
            onPress={handleActivateInteractiveBlock}
            prefix={blockKey}
            speakingTokenKey={speakingTokenKey}
            style={styles.paragraph}
        />
      );
    }

    return (
      <View style={styles.wordPickBlock}>
        <Ionicons
          color="rgba(111, 63, 240, 0.5)"
          name="language-outline"
          size={16}
          style={styles.wordPickHint}
        />
        <TouchableInlineText
          nodes={normalizeInlineNodesForWordSelection(block.children)}
          onWordPress={onWordPress}
          prefix={blockKey}
          selectedTokenKeys={selectedTokenKeys}
          speakingTokenKey={speakingTokenKey}
          style={styles.paragraph}
        />
      </View>
    );
  }

  if (block.type === 'list') {
    return (
      <View style={[styles.list, isInteractiveBlock ? styles.wordPickBlock : null]}>
        {block.items.map((item, itemIndex) => (
          isInteractiveBlock ? (
            <TouchableListItem
              item={normalizeInlineNodesForWordSelection(item)}
              itemIndex={itemIndex}
              key={`${blockKey}-item-${itemIndex}`}
              onWordPress={onWordPress}
              ordered={block.ordered}
              prefix={`${blockKey}-item-${itemIndex}`}
              selectedTokenKeys={selectedTokenKeys}
              speakingTokenKey={speakingTokenKey}
            />
          ) : (
            <PlainListItem
              item={item}
              itemIndex={itemIndex}
              key={`${blockKey}-item-${itemIndex}`}
              onPress={handleActivateInteractiveBlock}
              ordered={block.ordered}
              prefix={`${blockKey}-item-${itemIndex}`}
              speakingTokenKey={speakingTokenKey}
            />
          )
        ))}
        {isInteractiveBlock ? (
          <Ionicons
            color="rgba(111, 63, 240, 0.5)"
            name="language-outline"
            size={16}
            style={styles.wordPickHint}
          />
        ) : null}
      </View>
    );
  }

  if (block.type === 'table') {
    return (
      <ArticleTableBlock
        renderCellContent={({ cell, prefix, selectedTokenKey: currentSelectedTokenKey }) =>
          renderTableCellText({
            cell,
            onWordPress,
            prefix,
            selectedTokenKey: currentSelectedTokenKey,
            speakingTokenKey,
          })
        }
        rows={block.rows}
        selectedTokenKey={selectedTokenKeys?.[0]}
      />
    );
  }

  if (block.type === 'formula') {
    return (
      <ArticleFormulaBlock
        altText={block.altText}
        heightEx={block.heightEx}
        svg={block.svg}
        widthEx={block.widthEx}
      />
    );
  }

  if (block.type !== 'image') {
    return null;
  }

  return <ArticleImageBlock alt={block.alt} caption={block.caption} src={block.src} />;
}, areArticleBlockRowPropsEqual);

function areArticleBlockRowPropsEqual(
  previousProps: ArticleBlockRowProps,
  nextProps: ArticleBlockRowProps,
): boolean {
  if (
    previousProps.block !== nextProps.block ||
    previousProps.blockKey !== nextProps.blockKey ||
    previousProps.chevronColor !== nextProps.chevronColor ||
    previousProps.collapsed !== nextProps.collapsed ||
    previousProps.onActivateInteractiveBlock !== nextProps.onActivateInteractiveBlock ||
    previousProps.onToggleHeading !== nextProps.onToggleHeading ||
    previousProps.onWordPress !== nextProps.onWordPress
  ) {
    return false;
  }

  const wasInteractiveBlock =
    previousProps.activeInteractiveBlockKey === previousProps.blockKey;
  const isInteractiveBlock = nextProps.activeInteractiveBlockKey === nextProps.blockKey;

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

const PlainInlineText = memo(function PlainInlineText({
  nodes,
  onPress,
  prefix,
  speakingTokenKey,
  style,
}: PlainInlineTextProps) {
  const shouldHighlightSentence =
    ENABLE_SPEECH_SENTENCE_HIGHLIGHT &&
    isTokenKeyInsidePrefix(speakingTokenKey, prefix);
  const highlightedSentenceContent = useMemo(() => {
    if (!shouldHighlightSentence) {
      return null;
    }

    const parts = splitTextToTouchableParts(
      normalizeInlineNodesForWordSelection(nodes),
      prefix,
    );
    const speakingSentenceKey = getSpeakingSentenceKey(parts, speakingTokenKey);

    if (!speakingSentenceKey) {
      return null;
    }

    return createPlainSentenceGroups(parts).map((group) => {
      const renderedParts = group.parts.map(renderPlainTouchablePart);

      if (group.sentenceKey === speakingSentenceKey) {
        return (
          <ThemedText key={group.key} style={styles.speakingSentence} type="paragraph">
            {renderedParts}
          </ThemedText>
        );
      }

      return <Fragment key={group.key}>{renderedParts}</Fragment>;
    });
  }, [nodes, prefix, shouldHighlightSentence, speakingTokenKey]);
  const segments = useMemo(() => createPlainTextSegments(nodes), [nodes]);

  if (highlightedSentenceContent) {
    return (
      <ThemedText onPress={onPress} style={style} type="paragraph">
        {highlightedSentenceContent}
      </ThemedText>
    );
  }

  if (segments.length === 1) {
    const segment = segments[0];

    return (
      <ThemedText
        onPress={onPress}
        style={[
          style,
          segment?.bold ? styles.inlineBold : null,
          segment?.italic ? styles.inlineItalic : null,
        ]}
        type="paragraph">
        {segment?.text ?? ''}
      </ThemedText>
    );
  }

  return (
    <ThemedText onPress={onPress} style={style} type="paragraph">
      {segments.map((segment) => (
        <ThemedText
          key={segment.key}
          onPress={onPress}
          style={[
            segment.bold ? styles.inlineBold : null,
            segment.italic ? styles.inlineItalic : null,
          ]}
          type="paragraph">
          {segment.text}
        </ThemedText>
      ))}
    </ThemedText>
  );
});

const PlainListItem = memo(function PlainListItem({
  item,
  itemIndex,
  onPress,
  ordered,
  prefix,
  speakingTokenKey,
}: {
  item: InlineNode[];
  itemIndex: number;
  onPress: () => void;
  ordered: boolean;
  prefix: string;
  speakingTokenKey?: string;
}) {
  return (
    <View style={styles.listItem}>
      <ThemedText style={styles.listBullet} type="paragraph">
        {ordered ? `${itemIndex + 1}.` : '\u2022'}
      </ThemedText>
      <PlainInlineText
        nodes={item}
        onPress={onPress}
        prefix={prefix}
        speakingTokenKey={speakingTokenKey}
        style={styles.listItemText}
      />
    </View>
  );
});

function renderPlainTouchablePart(part: TouchableTextPart) {
  return (
    <ThemedText
      key={part.key}
      style={[
        part.bold ? styles.inlineBold : null,
        part.italic ? styles.inlineItalic : null,
      ]}
      type="paragraph">
      {part.text}
    </ThemedText>
  );
}

function createPlainSentenceGroups(parts: TouchableTextPart[]): PlainSentenceGroup[] {
  const groups: PlainSentenceGroup[] = [];

  parts.forEach((part) => {
    const sentenceKey = part.type === 'word' ? part.sentenceKey : undefined;
    const currentGroup = groups[groups.length - 1];

    if (
      currentGroup &&
      (!sentenceKey || currentGroup.sentenceKey === sentenceKey)
    ) {
      currentGroup.parts.push(part);
      return;
    }

    groups.push({
      key: sentenceKey ?? part.key,
      parts: [part],
      sentenceKey,
    });
  });

  return groups;
}

function createPlainTextSegments(nodes: InlineNode[]): PlainTextSegment[] {
  const segments: PlainTextSegment[] = [];

  nodes.forEach((node, index) => {
    const previousSegment = segments[segments.length - 1];

    if (
      previousSegment &&
      Boolean(previousSegment.bold) === Boolean(node.bold) &&
      Boolean(previousSegment.italic) === Boolean(node.italic)
    ) {
      previousSegment.text += node.text;
      return;
    }

    segments.push({
      bold: node.bold,
      italic: node.italic,
      key: `plain-${index}`,
      text: node.text,
    });
  });

  return segments;
}

function renderTouchableParts(params: {
  nodes: InlineNode[];
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKey?: string;
  speakingTokenKey?: string;
}) {
  return renderTouchablePartsFromParts({
    onWordPress: params.onWordPress,
    parts: splitTextToTouchableParts(params.nodes, params.prefix),
    selectedTokenKey: params.selectedTokenKey,
    speakingTokenKey: params.speakingTokenKey,
  });
}

function renderTouchablePartsFromParts(params: {
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  parts: TouchableTextPart[];
  selectedTokenKey?: string;
  selectedTokenKeys?: string[];
  speakingTokenKey?: string;
}) {
  const selectedTokenKeySet = new Set([
    ...(params.selectedTokenKeys ?? []),
    ...(params.selectedTokenKey ? [params.selectedTokenKey] : []),
  ]);
  const speakingSentenceKey = ENABLE_SPEECH_SENTENCE_HIGHLIGHT
    ? getSpeakingSentenceKey(params.parts, params.speakingTokenKey)
    : undefined;
  const sentenceGroups = createTouchableTextSentenceGroups(params.parts);

  return sentenceGroups.map((group) => {
    const renderedParts = group.parts.map((part) =>
      renderTouchablePart({
        onWordPress: params.onWordPress,
        part,
        selectedTokenKeySet,
        speakingTokenKey: ENABLE_SPEECH_WORD_HIGHLIGHT
          ? params.speakingTokenKey
          : undefined,
      }),
    );

    if (group.sentenceKey && group.sentenceKey === speakingSentenceKey) {
      return (
        <ThemedText key={group.key} style={styles.speakingSentence} type="paragraph">
          {renderedParts}
        </ThemedText>
      );
    }

    return <Fragment key={group.key}>{renderedParts}</Fragment>;
  });
}

function renderTouchablePart(params: {
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  part: TouchableTextPart;
  selectedTokenKeySet: ReadonlySet<string>;
  speakingTokenKey?: string;
}) {
  const { part } = params;

  if (part.type === 'text') {
    return (
      <ThemedText
        key={part.key}
        style={[
          part.bold ? styles.inlineBold : null,
          part.italic ? styles.inlineItalic : null,
        ]}
        type="paragraph">
        {part.text}
      </ThemedText>
    );
  }

  return (
    <TouchableWord
      key={part.key}
      bold={part.bold}
      contextSentence={part.contextSentence}
      italic={part.italic}
      onPress={params.onWordPress}
      selected={params.selectedTokenKeySet.has(part.key)}
      sentenceKey={part.sentenceKey}
      sentenceWordIndex={part.sentenceWordIndex}
      speaking={params.speakingTokenKey === part.key}
      text={part.text}
      tokenKey={part.key}
      word={part.word}
    />
  );
}

function getSpeakingSentenceKey(
  parts: TouchableTextPart[],
  speakingTokenKey: string | undefined,
): string | undefined {
  if (!speakingTokenKey) {
    return undefined;
  }

  return parts.find(
    (part) => part.type === 'word' && part.key === speakingTokenKey,
  )?.sentenceKey;
}

function createTouchableTextSentenceGroups(
  parts: TouchableTextPart[],
): TouchableTextSentenceGroup[] {
  const groups: TouchableTextSentenceGroup[] = [];

  parts.forEach((part) => {
    const sentenceKey = part.type === 'word' ? part.sentenceKey : undefined;
    const currentGroup = groups[groups.length - 1];

    if (
      currentGroup &&
      (!sentenceKey || currentGroup.sentenceKey === sentenceKey)
    ) {
      currentGroup.parts.push(part);
      return;
    }

    groups.push({
      key: sentenceKey ?? part.key,
      parts: [part],
      sentenceKey,
    });
  });

  return groups;
}

const TouchableInlineText = memo(function TouchableInlineText({
  nodes,
  onWordPress,
  prefix,
  selectedTokenKeys,
  speakingTokenKey,
  style,
}: TouchableInlineTextProps) {
  const parts = useMemo(
    () => splitTextToTouchableParts(nodes, prefix),
    [nodes, prefix],
  );

  return (
    <ThemedText style={style} type="paragraph">
      {renderTouchablePartsFromParts({
        onWordPress,
        parts,
        selectedTokenKeys,
        speakingTokenKey,
      })}
    </ThemedText>
  );
}, areTouchableInlineTextPropsEqual);

const TouchableListItem = memo(function TouchableListItem({
  item,
  itemIndex,
  onWordPress,
  ordered,
  prefix,
  selectedTokenKeys,
  speakingTokenKey,
}: TouchableListItemProps) {
  return (
    <View style={styles.listItem}>
      <ThemedText style={styles.listBullet} type="paragraph">
        {ordered ? `${itemIndex + 1}.` : '\u2022'}
      </ThemedText>
      <TouchableInlineText
        nodes={item}
        onWordPress={onWordPress}
        prefix={prefix}
        selectedTokenKeys={selectedTokenKeys}
        speakingTokenKey={speakingTokenKey}
        style={styles.listItemText}
      />
    </View>
  );
}, areTouchableListItemPropsEqual);

function areTouchableInlineTextPropsEqual(
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

function areTouchableListItemPropsEqual(
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

function isSpeakingTokenChangeIrrelevant(params: {
  nextSpeakingTokenKey?: string;
  prefix: string;
  previousSpeakingTokenKey?: string;
}): boolean {
  const wasSpeakingInsidePrefix = isTokenKeyInsidePrefix(
    params.previousSpeakingTokenKey,
    params.prefix,
  );
  const isSpeakingInsidePrefix = isTokenKeyInsidePrefix(
    params.nextSpeakingTokenKey,
    params.prefix,
  );

  if (!wasSpeakingInsidePrefix && !isSpeakingInsidePrefix) {
    return true;
  }

  return params.previousSpeakingTokenKey === params.nextSpeakingTokenKey;
}

function isSelectedTokensChangeIrrelevant(params: {
  nextSelectedTokenKeys?: string[];
  prefix: string;
  previousSelectedTokenKeys?: string[];
}): boolean {
  const previousSelectionKeysInPrefix = (params.previousSelectedTokenKeys ?? []).filter(
    (tokenKey) => isTokenKeyInsidePrefix(tokenKey, params.prefix),
  );
  const nextSelectionKeysInPrefix = (params.nextSelectedTokenKeys ?? []).filter(
    (tokenKey) => isTokenKeyInsidePrefix(tokenKey, params.prefix),
  );

  if (
    previousSelectionKeysInPrefix.length === 0 &&
    nextSelectionKeysInPrefix.length === 0
  ) {
    return true;
  }

  if (previousSelectionKeysInPrefix.length !== nextSelectionKeysInPrefix.length) {
    return false;
  }

  return previousSelectionKeysInPrefix.every(
    (tokenKey, index) => tokenKey === nextSelectionKeysInPrefix[index],
  );
}

function isTokenKeyInsidePrefix(
  tokenKey: string | undefined,
  prefix: string,
): boolean {
  return tokenKey?.startsWith(`${prefix}-`) ?? false;
}

function renderTableCellText(params: {
  cell: TableCell;
  onWordPress: InteractiveArticleTextProps['onWordPress'];
  prefix: string;
  selectedTokenKey?: string;
  speakingTokenKey?: string;
}) {
  return renderTouchableParts({
    nodes: createInlineNodesFromPlainText(params.cell.text),
    onWordPress: params.onWordPress,
    prefix: params.prefix,
    selectedTokenKey: params.selectedTokenKey,
    speakingTokenKey: params.speakingTokenKey,
  });
}

function createHeadingKey(
  block: Extract<ArticleBlock, { type: 'heading' }>,
  index: number,
): string {
  return `heading-${index}-${block.text}`;
}

function parsePlainTextToBlocks(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const lines = text.split(/\r?\n/);
  let paragraphLines: string[] = [];
  let listItems: InlineNode[][] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    const paragraphText = paragraphLines.join(' ').trim();

    if (!paragraphText) {
      paragraphLines = [];
      return;
    }

    blocks.push({
      children: createInlineNodesFromPlainText(paragraphText),
      type: 'paragraph',
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      items: listItems,
      ordered: listOrdered,
      type: 'list',
    });
    listItems = [];
    listOrdered = false;
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(SECTION_HEADING_PATTERN);

    if (headingMatch) {
      flushParagraph();
      flushList();
      const headingLevel = Math.min((headingMatch[1]?.length ?? 2) - 1, 3) as
        | 1
        | 2
        | 3;
      const headingText = headingMatch[2]?.trim() ?? line;

      if (headingText) {
        blocks.push({
          level: headingLevel,
          text: headingText,
          type: 'heading',
        });
      }

      continue;
    }

    const listItemMatch = line.match(LIST_ITEM_PATTERN);

    if (listItemMatch) {
      flushParagraph();
      const marker = listItemMatch[1] ?? '-';
      const itemText = listItemMatch[2]?.trim() ?? '';

      if (itemText) {
        listOrdered = marker.startsWith('#') || /^\d+[.)]$/.test(marker);
        listItems.push(createInlineNodesFromPlainText(itemText));
      }

      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function createInlineNodesFromPlainText(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      nodes.push({
        text: text.slice(cursor, start),
        type: 'text',
      });
    }

    nodes.push({
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < text.length) {
    nodes.push({
      text: text.slice(cursor),
      type: 'text',
    });
  }

  return nodes;
}

function normalizeBlocksForWordSelection(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks.map((block) => {
    if (block.type === 'paragraph') {
      return {
        ...block,
        children: normalizeInlineNodesForWordSelection(block.children),
      };
    }

    if (block.type === 'list') {
      return {
        ...block,
        items: block.items.map((item) => normalizeInlineNodesForWordSelection(item)),
      };
    }

    return block;
  });
}

function normalizeInlineNodesForWordSelection(nodes: InlineNode[]): InlineNode[] {
  const normalized: InlineNode[] = [];

  nodes.forEach((node) => {
    if (node.type === 'word') {
      normalized.push(node);
      return;
    }

    normalized.push(...splitTextNodeToInlineNodes(node));
  });

  return normalized;
}

function splitTextNodeToInlineNodes(node: Extract<InlineNode, { type: 'text' }>): InlineNode[] {
  const result: InlineNode[] = [];
  let cursor = 0;

  for (const match of node.text.matchAll(/[A-Za-z]+(?:['\u2019-][A-Za-z]+)*/g)) {
    const matchedWord = match[0];
    const start = match.index ?? 0;

    if (cursor < start) {
      result.push({
        bold: node.bold,
        italic: node.italic,
        text: node.text.slice(cursor, start),
        type: 'text',
      });
    }

    result.push({
      bold: node.bold,
      italic: node.italic,
      text: matchedWord,
      type: 'word',
    });
    cursor = start + matchedWord.length;
  }

  if (cursor < node.text.length) {
    result.push({
      bold: node.bold,
      italic: node.italic,
      text: node.text.slice(cursor),
      type: 'text',
    });
  }

  if (result.length === 0) {
    return [node];
  }

  return result;
}

function getHeadingTypographyType(level: 1 | 2 | 3) {
  if (level === 1) {
    return 'screenTitle' as const;
  }

  if (level === 2) {
    return 'sectionTitle' as const;
  }

  return 'bodyStrong' as const;
}
