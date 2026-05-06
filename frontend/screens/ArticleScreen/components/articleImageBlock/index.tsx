import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import ImageViewing from 'react-native-image-viewing';

import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type ArticleImageBlockProps = {
  alt?: string;
  caption?: string;
  src: string;
};

const FALLBACK_TITLE = 'Image unavailable';
const MAX_CAPTION_LINES = 4;
const MAX_ALT_FALLBACK_LINES = 5;

export function ArticleImageBlock({
  alt,
  caption,
  src,
}: ArticleImageBlockProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
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
  const viewerImages = useMemo(() => [{ uri: src }], [src]);

  useEffect(() => {
    setHasLoadError(false);
    setViewerOpen(false);
  }, [src]);

  const handleOpenViewer = useCallback(() => {
    setViewerOpen(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const ViewerHeader = useCallback(
    () => (
      <Pressable
        hitSlop={12}
        onPress={handleCloseViewer}
        style={styles.viewerCloseButton}>
        <Ionicons color="#ffffff" name="close" size={28} />
      </Pressable>
    ),
    [handleCloseViewer],
  );
  const ViewerFooter = useCallback(
    () =>
      caption ? (
        <ThemedText
          darkColor="#ffffff"
          lightColor="#ffffff"
          numberOfLines={3}
          style={styles.viewerCaption}
          type="body">
          {caption}
        </ThemedText>
      ) : null,
    [caption],
  );

  if (!src || hasLoadError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView
          darkColor={fallbackBackgroundColor}
          lightColor={fallbackBackgroundColor}
          style={[styles.fallback, { borderColor }]}>
          <ThemedText style={styles.fallbackTitle} type="bodyStrong">
            {FALLBACK_TITLE}
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
      <ImageViewing
        animationType="fade"
        backgroundColor="#000000"
        doubleTapToZoomEnabled
        FooterComponent={ViewerFooter}
        HeaderComponent={ViewerHeader}
        imageIndex={0}
        images={viewerImages}
        onRequestClose={handleCloseViewer}
        presentationStyle="overFullScreen"
        swipeToCloseEnabled
        visible={viewerOpen}
      />
    </ThemedView>
  );
}
