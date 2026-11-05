import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

import { createStyles } from './styles';

type ArticleFormulaBlockProps = {
  altText: string;
  heightEx?: number;
  svg?: string;
  widthEx?: number;
};

const FORMULA_EX_UNIT_PX = 8.5;

export function ArticleFormulaBlock({
  altText,
  heightEx,
  svg,
  widthEx,
}: ArticleFormulaBlockProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const imageSource = useMemo(() => {
    if (!svg) {
      return null;
    }

    return {
      uri: `data:image/svg+xml;utf8,${encodeURIComponent(
        svg.replaceAll('currentColor', colors.text),
      )}`,
    };
  }, [svg, colors.text]);
  const estimatedWidth = Math.max(
    Typography.paragraph.fontSize ?? 18,
    (widthEx ?? 10) * FORMULA_EX_UNIT_PX,
  );
  const estimatedHeight = Math.max(
    Typography.paragraph.lineHeight ?? 28,
    (heightEx ?? 2.4) * FORMULA_EX_UNIT_PX,
  );
  const availableWidth = Math.max(
    200,
    windowWidth - Spacing.xLg * 2 - Spacing.md * 2,
  );
  const shouldScroll = estimatedWidth > availableWidth;
  const renderedWidth = shouldScroll
    ? estimatedWidth
    : Math.min(estimatedWidth, availableWidth);
  const renderedHeight =
    estimatedWidth > 0
      ? (renderedWidth / estimatedWidth) * estimatedHeight
      : estimatedHeight;

  return (
    <View style={styles.container}>
      {imageSource ? (
        <ScrollView
          horizontal
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
        >
          <Image
            accessibilityLabel={altText}
            contentFit="contain"
            source={imageSource}
            style={{
              height: renderedHeight,
              width: renderedWidth,
            }}
          />
        </ScrollView>
      ) : (
        <ThemedText type="body" style={styles.fallbackText}>
          {altText}
        </ThemedText>
      )}
    </View>
  );
}
