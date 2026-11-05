import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    collapsibleArrowExpanded: {
      transform: [{ rotate: '180deg' }],
    },
    collapsibleHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    heading: {
      includeFontPadding: false,
      flex: 1,
    },
    headingLevel1: {
      marginTop: Spacing.sm,
    },
    headingLevel2: {
      marginTop: Spacing.xs,
    },
    headingLevel3: {
      marginTop: Spacing.xs,
    },
    inlineBold: {
      fontWeight: '700',
    },
    inlineItalic: {
      fontStyle: 'italic',
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
    paragraph: {
      includeFontPadding: false,
      lineHeight: Typography.paragraph.lineHeight,
    },
    speakingSentence: {
      backgroundColor: colors.textHighlight,
      borderRadius: 6,
    },
    wordPickBlock: {
      backgroundColor: colors.accentSurface,
      borderLeftColor: colors.accentBorder,
      borderLeftWidth: 3,
      borderRadius: 6,
      paddingLeft: Spacing.sm,
    },
    wordPickHint: {
      alignSelf: 'flex-end',
      marginBottom: -Spacing.xs,
      opacity: 0.85,
    },
  });
