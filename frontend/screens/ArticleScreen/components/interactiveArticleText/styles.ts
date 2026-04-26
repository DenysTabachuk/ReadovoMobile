import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  heading: {
    includeFontPadding: false,
  },
  list: {
    gap: Spacing.sm,
  },
  listBullet: {
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
    width: 20,
  },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  listItemText: {
    flex: 1,
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
  },
  subheading: {
    marginTop: Spacing.xs,
  },
  paragraph: {
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
  },
  selectedWord: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  selectedWordText: {
    color: '#ffffff',
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
  },
  tappableWord: {
    borderRadius: 6,
    paddingHorizontal: 1,
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
  },
});
