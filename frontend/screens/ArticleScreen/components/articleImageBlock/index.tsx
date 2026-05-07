import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type ArticleImageBlockProps = {
  alt?: string;
  caption?: string;
  src: string;
};

const MAX_CAPTION_LINES = 4;
const MAX_ALT_FALLBACK_LINES = 5;
const MIN_VIEWER_SCALE = 1;
const MAX_VIEWER_SCALE = 4;
const DOUBLE_TAP_VIEWER_SCALE = 2;

export function ArticleImageBlock({
  alt,
  caption,
  src,
}: ArticleImageBlockProps) {
  const { t } = useTranslation();
  const [hasLoadError, setHasLoadError] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoadError, setViewerLoadError] = useState(false);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const viewerScale = useSharedValue(MIN_VIEWER_SCALE);
  const savedViewerScale = useSharedValue(MIN_VIEWER_SCALE);
  const viewerTranslateX = useSharedValue(0);
  const viewerTranslateY = useSharedValue(0);
  const savedViewerTranslateX = useSharedValue(0);
  const savedViewerTranslateY = useSharedValue(0);
  const borderColor = useThemeColor(
    { dark: 'rgba(255, 255, 255, 0.16)', light: 'rgba(17, 24, 28, 0.12)' },
    'icon',
  );
  const fallbackBackgroundColor = useThemeColor(
    { dark: 'rgba(255, 255, 255, 0.06)', light: 'rgba(17, 24, 28, 0.04)' },
    'background',
  );
  const fallbackText = useMemo(() => {
    const normalizedCaption = caption?.trim();
    const normalizedAlt = alt?.trim();

    if (normalizedCaption && normalizedAlt && normalizedCaption !== normalizedAlt) {
      return `${normalizedCaption}\n${normalizedAlt}`;
    }

    return normalizedCaption ?? normalizedAlt ?? null;
  }, [alt, caption]);
  const resetViewerTransform = useCallback(() => {
    viewerScale.value = MIN_VIEWER_SCALE;
    savedViewerScale.value = MIN_VIEWER_SCALE;
    viewerTranslateX.value = 0;
    viewerTranslateY.value = 0;
    savedViewerTranslateX.value = 0;
    savedViewerTranslateY.value = 0;
  }, [
    savedViewerScale,
    savedViewerTranslateX,
    savedViewerTranslateY,
    viewerScale,
    viewerTranslateX,
    viewerTranslateY,
  ]);
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((event) => {
          viewerScale.value = clampViewerScale(
            savedViewerScale.value * event.scale,
          );
        })
        .onEnd(() => {
          if (viewerScale.value <= MIN_VIEWER_SCALE) {
            viewerScale.value = withSpring(MIN_VIEWER_SCALE);
            savedViewerScale.value = MIN_VIEWER_SCALE;
            viewerTranslateX.value = withSpring(0);
            viewerTranslateY.value = withSpring(0);
            savedViewerTranslateX.value = 0;
            savedViewerTranslateY.value = 0;
            return;
          }

          savedViewerScale.value = viewerScale.value;
        }),
    [
      savedViewerScale,
      savedViewerTranslateX,
      savedViewerTranslateY,
      viewerScale,
      viewerTranslateX,
      viewerTranslateY,
    ],
  );
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          if (viewerScale.value <= MIN_VIEWER_SCALE) {
            return;
          }

          viewerTranslateX.value = savedViewerTranslateX.value + event.translationX;
          viewerTranslateY.value = savedViewerTranslateY.value + event.translationY;
        })
        .onEnd(() => {
          savedViewerTranslateX.value = viewerTranslateX.value;
          savedViewerTranslateY.value = viewerTranslateY.value;
        }),
    [
      savedViewerTranslateX,
      savedViewerTranslateY,
      viewerScale,
      viewerTranslateX,
      viewerTranslateY,
    ],
  );
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          if (viewerScale.value > MIN_VIEWER_SCALE) {
            viewerScale.value = withSpring(MIN_VIEWER_SCALE);
            savedViewerScale.value = MIN_VIEWER_SCALE;
            viewerTranslateX.value = withSpring(0);
            viewerTranslateY.value = withSpring(0);
            savedViewerTranslateX.value = 0;
            savedViewerTranslateY.value = 0;
            return;
          }

          viewerScale.value = withSpring(DOUBLE_TAP_VIEWER_SCALE);
          savedViewerScale.value = DOUBLE_TAP_VIEWER_SCALE;
        }),
    [
      savedViewerScale,
      savedViewerTranslateX,
      savedViewerTranslateY,
      viewerScale,
      viewerTranslateX,
      viewerTranslateY,
    ],
  );
  const viewerGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture),
    [doubleTapGesture, panGesture, pinchGesture],
  );
  const viewerImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: viewerTranslateX.value },
      { translateY: viewerTranslateY.value },
      { scale: viewerScale.value },
    ],
  }));

  useEffect(() => {
    setHasLoadError(false);
    setViewerOpen(false);
    setViewerLoadError(false);
    setViewerLoaded(false);
    resetViewerTransform();
  }, [resetViewerTransform, src]);

  const handleOpenViewer = useCallback(() => {
    setViewerLoadError(false);
    setViewerLoaded(false);
    resetViewerTransform();
    setViewerOpen(true);
  }, [resetViewerTransform]);

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
    setViewerLoadError(false);
    setViewerLoaded(false);
    resetViewerTransform();
  }, [resetViewerTransform]);

  if (!src || hasLoadError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView
          darkColor={fallbackBackgroundColor}
          lightColor={fallbackBackgroundColor}
          style={[styles.fallback, { borderColor }]}>
          <ThemedText style={styles.fallbackTitle} type="bodyStrong">
            {t('article.imageUnavailable')}
          </ThemedText>
          {fallbackText ? (
            <ThemedText
              ellipsizeMode="tail"
              numberOfLines={MAX_ALT_FALLBACK_LINES}
              style={styles.fallbackText}
              type="body">
              {fallbackText}
            </ThemedText>
          ) : null}
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={handleOpenViewer}>
        <Image
          cachePolicy="disk"
          contentFit="contain"
          onError={() => setHasLoadError(true)}
          source={{ uri: src }}
          style={styles.image}
          transition={120}
        />
      </Pressable>
      {caption ? (
        <ThemedText
          ellipsizeMode="tail"
          numberOfLines={MAX_CAPTION_LINES}
          style={styles.caption}
          type="body">
          {caption}
        </ThemedText>
      ) : null}
      <Modal
        animationType="fade"
        onRequestClose={handleCloseViewer}
        presentationStyle="overFullScreen"
        transparent
        visible={viewerOpen}>
        <GestureHandlerRootView style={styles.viewerRoot}>
          <View style={styles.viewer}>
            <Pressable
              hitSlop={12}
              onPress={handleCloseViewer}
              style={styles.viewerCloseButton}>
              <Ionicons color="#ffffff" name="close" size={28} />
            </Pressable>
            {!viewerLoaded && !viewerLoadError ? (
              <View style={styles.viewerLoading}>
                <ActivityIndicator color="#ffffff" size="large" />
              </View>
            ) : null}
            {viewerLoadError ? (
              <ThemedText
                darkColor="#ffffff"
                lightColor="#ffffff"
                style={styles.viewerFallbackTitle}
                type="bodyStrong">
                {t('article.imageUnavailable')}
              </ThemedText>
            ) : (
              <GestureDetector gesture={viewerGesture}>
                <Animated.View style={[styles.viewerImageWrapper, viewerImageStyle]}>
                  <Image
                    contentFit="contain"
                    onError={() => setViewerLoadError(true)}
                    onLoad={() => setViewerLoaded(true)}
                    source={{ uri: src }}
                    style={styles.viewerImage}
                  />
                </Animated.View>
              </GestureDetector>
            )}
            {caption ? (
              <ThemedText
                darkColor="#ffffff"
                lightColor="#ffffff"
                numberOfLines={3}
                style={styles.viewerCaption}
                type="body">
                {caption}
              </ThemedText>
            ) : null}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </ThemedView>
  );
}

function clampViewerScale(value: number) {
  'worklet';

  return Math.min(Math.max(value, MIN_VIEWER_SCALE), MAX_VIEWER_SCALE);
}
