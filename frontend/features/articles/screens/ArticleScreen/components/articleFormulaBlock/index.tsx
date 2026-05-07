import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

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
  const borderColor = useThemeColor(
    { light: 'rgba(17, 24, 28, 0.12)', dark: 'rgba(255, 255, 255, 0.16)' },
    'icon',
  );
  const surfaceColor = useThemeColor(
    { light: '#f5f7fa', dark: '#202425' },
    'background',
  );
  const textColor = useThemeColor({}, 'text');
  const imageSource = useMemo(() => {
    if (!svg) {
      return null;
    }

    return {
      uri: `data:image/svg+xml;utf8,${encodeURIComponent(
        svg.replaceAll('currentColor', textColor),
      )}`,
    };
  }, [svg, textColor]);
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
    <View
      style={[
        styles.container,
        {
          backgroundColor: surfaceColor,
          borderColor,
        },
      ]}>
      {imageSource ? (
        <ScrollView
          horizontal
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}>
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
