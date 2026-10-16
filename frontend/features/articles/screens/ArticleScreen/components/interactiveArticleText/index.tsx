import {
  type InteractiveArticleTextProps,
  type ArticleBlockListItem,
} from './types';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { parsePlainTextToBlocks } from './utils/parsePlainTextToBlocks';
import { createVisibleBlockItems } from './utils/createVisibleBlockItems';
import { type ListRenderItem, FlatList } from 'react-native';
import { ArticleBlockRow } from './components/articleBlockRow';
import {
  ENABLE_SPEECH_SENTENCE_HIGHLIGHT,
  ENABLE_SPEECH_WORD_HIGHLIGHT,
} from './constants';
import { styles } from './styles';

const INITIAL_RENDER_BLOCK_COUNT = 18;

const MAX_RENDER_BATCH_SIZE = 24;

const RENDER_BATCH_INTERVAL_MS = 16;

const VIRTUALIZED_WINDOW_SIZE = 13;

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
  const [collapsedHeadings, setCollapsedHeadings] = useState<
    Record<string, boolean>
  >({});
  const onVisibleBlockIndexChangeRef = useRef(onVisibleBlockIndexChange);
  const onVisibleBlockRangeChangeRef = useRef(onVisibleBlockRangeChange);
  const chevronColor = useThemeColor(
    { dark: '#9ba1a6', light: '#687076' },
    'icon',
  );
  const resolvedBlocks = useMemo(() => {
    if (blocks && blocks.length > 0) {
      return blocks;
    }

    return parsePlainTextToBlocks(text ?? '');
  }, [blocks, text]);
  const visibleBlockItems = useMemo(
    () => createVisibleBlockItems(resolvedBlocks, collapsedHeadings),
    [collapsedHeadings, resolvedBlocks],
  );

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
      viewableItems: {
        index: number | null;
        item?: ArticleBlockListItem;
      }[];
    }) => {
      const sortedVisibleItems = viewableItems
        .filter((viewableItem) => viewableItem.index !== null)
        .sort(
          (leftItem, rightItem) =>
            (leftItem.index ?? 0) - (rightItem.index ?? 0),
        );
      const firstVisibleItem = sortedVisibleItems[0]?.item;
      const lastVisibleItem =
        sortedVisibleItems[sortedVisibleItems.length - 1]?.item;

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
