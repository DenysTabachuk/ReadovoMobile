import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    paragraph: { fontSize: 18, lineHeight: 29, color: colors.readingText },
    largeParagraph: { fontSize: 21, lineHeight: 34 },
    underlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      color: 'transparent',
    },
    invisibleText: { color: 'transparent' },
    highlight: {
      color: colors.readingHighlightLine,
      backgroundColor: colors.readingHighlightSurface,
      textDecorationLine: 'underline',
    },
  });
