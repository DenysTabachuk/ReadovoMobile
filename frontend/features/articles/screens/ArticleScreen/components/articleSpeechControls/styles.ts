import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    container: {
      backgroundColor: colors.surface,
      borderLeftColor: colors.accentBorder,
      borderLeftWidth: 4,
      borderRadius: 8,
      gap: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.md,
      justifyContent: 'space-between',
    },
    iconButton: {
      alignItems: 'center',
      borderRadius: 22,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    iconButtonDisabled: {
      opacity: 0.45,
    },
    iconButtonPressed: {
      opacity: 0.76,
    },
    primaryIconButton: {
      backgroundColor: colors.primary,
    },
    progressFill: {
      backgroundColor: colors.interactive,
      borderRadius: 999,
      height: '100%',
    },
    progressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 999,
      height: 4,
      overflow: 'hidden',
    },
    secondaryIconButton: {
      backgroundColor: colors.accentSurface,
    },
    statusText: {
      lineHeight: 26,
      minHeight: 52,
      opacity: 0.72,
    },
    titleGroup: {
      flex: 1,
      gap: Spacing.xs,
      minHeight: 80,
      justifyContent: 'center',
      minWidth: 0,
    },
  });
