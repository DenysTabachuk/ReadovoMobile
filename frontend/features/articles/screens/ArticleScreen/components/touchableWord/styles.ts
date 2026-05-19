import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { Typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  selectedWord: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  selectedWordText: {
    color: '#ffffff',
    lineHeight: Typography.paragraph.lineHeight,
  },
  speakingWord: {
    backgroundColor: '#f2c94c',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  speakingWordText: {
    color: '#11181C',
    lineHeight: Typography.paragraph.lineHeight,
  },
  word: {
    borderRadius: 6,
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
    paddingHorizontal: 1,
  },
});
