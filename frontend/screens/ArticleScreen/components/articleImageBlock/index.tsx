import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    setHasLoadError(false);
  }, [src]);

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
      <Image
        contentFit="contain"
        onError={() => setHasLoadError(true)}
        source={{ uri: src }}
        style={styles.image}
      />
      {caption ? (
        <ThemedText
          ellipsizeMode="tail"
          numberOfLines={MAX_CAPTION_LINES}
          style={styles.caption}
          type="body">
          {caption}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}
