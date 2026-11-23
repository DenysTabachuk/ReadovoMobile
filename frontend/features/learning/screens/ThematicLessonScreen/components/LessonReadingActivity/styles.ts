import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

const READING_COVER_ASPECT_RATIO = 2.2;

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.lg },
    cover: {
      aspectRatio: READING_COVER_ASPECT_RATIO,
      marginHorizontal: -Spacing.xLg,
      marginTop: -Spacing.xLg,
      overflow: 'hidden',
    },
    coverLayer: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    tools: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eyebrow: { color: colors.warning, fontSize: 13, letterSpacing: 1 },
    textSize: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    title: { fontFamily: Fonts.serif, lineHeight: 40 },
    paragraphs: { gap: Spacing.xLg },
    checkPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: Spacing.lg,
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    checkIllustration: { width: 72, height: 88 },
    checkCopy: {
      flex: 1,
      gap: Spacing.sm,
      borderLeftWidth: 1,
      borderLeftColor: colors.borderStrong,
      paddingLeft: Spacing.md,
    },
    checkTitle: { fontSize: 18, lineHeight: 24 },
    secondary: { color: colors.textSecondary },
  });
