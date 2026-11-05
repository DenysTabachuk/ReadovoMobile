import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Typography } from '@/constants/typography';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    bold: {
      fontWeight: '700',
    },
    italic: {
      fontStyle: 'italic',
    },
    selectedWord: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 6,
    },
    selectedWordText: {
      color: colors.onPrimary,
      lineHeight: Typography.paragraph.lineHeight,
    },
    speakingWord: {
      backgroundColor: colors.highlight,
      borderRadius: 8,
      paddingHorizontal: 6,
    },
    speakingWordText: {
      color: colors.onHighlight,
      lineHeight: Typography.paragraph.lineHeight,
    },
    word: {
      borderRadius: 6,
      includeFontPadding: false,
      lineHeight: Typography.paragraph.lineHeight,
      paddingHorizontal: 1,
    },
  });
};
