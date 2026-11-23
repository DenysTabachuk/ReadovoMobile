import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    path: { gap: Spacing.md },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      minHeight: 92,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    firstStep: {
      borderColor: colors.selectionBorder,
      backgroundColor: colors.selection,
    },
    number: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, gap: Spacing.xs },
    secondary: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.5 },
  });
