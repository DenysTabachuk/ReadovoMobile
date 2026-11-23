import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

const TOPIC_COVER_ASPECT_RATIO = 2.2;

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    pressed: { opacity: 0.9 },
    cover: { width: '100%', aspectRatio: TOPIC_COVER_ASPECT_RATIO },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      padding: Spacing.xLg,
    },
    copy: { flex: 1, gap: Spacing.sm },
    secondary: { color: colors.textSecondary },
  });
