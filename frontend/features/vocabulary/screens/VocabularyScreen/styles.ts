import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.xLg },
    header: { gap: Spacing.sm },
    secondary: { color: colors.textSecondary },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 24,
      padding: Spacing.lg,
      gap: Spacing.xLg,
    },
    cardPressed: {
      backgroundColor: colors.accentSurface,
      borderColor: colors.accentBorder,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      paddingTop: Spacing.lg,
    },
    link: { color: colors.interactive },
  });
