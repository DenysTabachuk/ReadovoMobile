import { Spacing } from '@/constants/spacing';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SCROLL_TO_TOP_THRESHOLD } from '../../constants';
import type { useArticleSpeech } from '../../useArticleSpeech';
import { getBlockIndexFromTokenKey } from '../../utils';

/**
 * Coordinates reader scroll controls with the current speech position.
 * Scroll events update React state only when visibility thresholds are crossed.
 * Wire the returned refs and scroll/layout/visibility handlers to the same reader;
 * visible indexes and the navigation callback must use source block indexes.
 *
 * @param articleSpeech - Speech state providing playback status and the active token.
 * @returns List/navigation refs, floating-control visibility/direction, and handlers.
 * The scroll-to-top offset signals a threshold crossing, not an exact scroll position.
 * @example
 * // Inside a component or another hook, with the reader callbacks wired:
 * const scroll = useArticleReaderScroll(speech);
 * scroll.handleScrollToCurrentSpeechWord();
 * // Requests navigation to the active source block, when one exists.
 */
export function useArticleReaderScroll(
  articleSpeech: ReturnType<typeof useArticleSpeech>,
) {
  const scrollToSourceIndexRef = useRef<((sourceIndex: number) => void) | null>(
    null,
  );
  const [scrollToTopOffsetY, setScrollToTopOffsetY] = useState(0);
  const [isScrolledPastSpeechControls, setIsScrolledPastSpeechControls] =
    useState(false);
  const [visibleBlockIndexes, setVisibleBlockIndexes] = useState<number[]>([]);
  const firstVisibleBlockIndex = visibleBlockIndexes[0] ?? 0;
  const articleListRef = useRef<FlatList>(null);
  const scrollOffsetYRef = useRef(0);
  const speechControlsBottomYRef = useRef<number | null>(null);
  const isScrollToTopVisibleRef = useRef(false);
  const isScrolledPastSpeechControlsRef = useRef(false);
  const currentSpeechBlockIndex = useMemo(
    () => getBlockIndexFromTokenKey(articleSpeech.activeTokenKey),
    [articleSpeech.activeTokenKey],
  );
  const isCurrentSpeechBlockVisible =
    currentSpeechBlockIndex !== null &&
    visibleBlockIndexes.includes(currentSpeechBlockIndex);
  const shouldShowCurrentSpeechButton =
    articleSpeech.status !== 'idle' &&
    Boolean(articleSpeech.activeTokenKey) &&
    !isCurrentSpeechBlockVisible;
  const currentSpeechButtonDirection =
    currentSpeechBlockIndex !== null &&
    currentSpeechBlockIndex < firstVisibleBlockIndex
      ? 'up'
      : 'down';
  const currentSpeechButtonIconName =
    currentSpeechButtonDirection === 'up'
      ? ('arrow-up' as const)
      : ('arrow-down' as const);

  const updateScrollThresholdState = useCallback(
    (nextScrollOffsetY: number) => {
      scrollOffsetYRef.current = nextScrollOffsetY;

      const isScrollToTopVisible = nextScrollOffsetY > SCROLL_TO_TOP_THRESHOLD;

      if (isScrollToTopVisibleRef.current !== isScrollToTopVisible) {
        isScrollToTopVisibleRef.current = isScrollToTopVisible;
        setScrollToTopOffsetY(
          isScrollToTopVisible ? SCROLL_TO_TOP_THRESHOLD + 1 : 0,
        );
      }

      const speechControlsBottomY = speechControlsBottomYRef.current;
      const isPastSpeechControls =
        speechControlsBottomY !== null &&
        nextScrollOffsetY > speechControlsBottomY + Spacing.sm;

      if (isScrolledPastSpeechControlsRef.current !== isPastSpeechControls) {
        isScrolledPastSpeechControlsRef.current = isPastSpeechControls;
        setIsScrolledPastSpeechControls(isPastSpeechControls);
      }
    },
    [],
  );

  const handleArticleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateScrollThresholdState(event.nativeEvent.contentOffset.y);
    },
    [updateScrollThresholdState],
  );

  const handleSpeechControlsLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, y } = event.nativeEvent.layout;

      speechControlsBottomYRef.current = y + height;
      updateScrollThresholdState(scrollOffsetYRef.current);
    },
    [updateScrollThresholdState],
  );

  const handleVisibleBlockIndexesChange = useCallback((indexes: number[]) => {
    setVisibleBlockIndexes((current) => {
      if (
        current.length === indexes.length &&
        current.every((index, position) => index === indexes[position])
      ) {
        return current;
      }
      return indexes;
    });
  }, []);

  const handleScrollToCurrentSpeechWord = useCallback(() => {
    if (currentSpeechBlockIndex === null) {
      return;
    }

    scrollToSourceIndexRef.current?.(currentSpeechBlockIndex);
  }, [currentSpeechBlockIndex]);

  return {
    articleListRef,
    scrollToSourceIndexRef,
    scrollToTopOffsetY,
    isScrolledPastSpeechControls,
    shouldShowCurrentSpeechButton,
    currentSpeechButtonIconName,
    handleArticleScroll,
    handleSpeechControlsLayout,
    handleVisibleBlockIndexesChange,
    handleScrollToCurrentSpeechWord,
  };
}
