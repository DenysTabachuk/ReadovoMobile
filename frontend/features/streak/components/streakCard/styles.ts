import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.md,
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
    },
    ctaButton: {
      alignItems: 'center',
      backgroundColor: colors.accentSolid,
      borderRadius: 12,
      paddingVertical: Spacing.sm,
    },
    ctaText: {
      color: colors.onAccentSolid,
      fontSize: 14,
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressCounter: {
      color: colors.text,
      fontSize: 13,
      minWidth: 40,
    },
    progressFill: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: '100%',
    },
    progressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    progressText: {
      fontSize: 13,
    },
    progressTrack: {
      borderRadius: 999,
      flex: 1,
      height: 8,
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
    },
    status: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      marginLeft: Spacing.md,
      textAlign: 'right',
      color: colors.textSecondary,
    },
    streakValue: {},
    subtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    valueRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    weekDot: {
      backgroundColor: 'transparent',
      borderRadius: 7,
      borderWidth: 1,
      height: 14,
      width: 14,
      borderColor: colors.accentBorder,
    },
    weekDotActive: {
      backgroundColor: colors.accentSolid,
      borderColor: colors.accentBorder,
    },
    weekItem: {
      alignItems: 'center',
      gap: 6,
    },
    weekLabel: {
      fontSize: 12,
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    subtleOn: {
      color: colors.textSecondary,
    },
    textOn: {
      color: colors.text,
    },
  });
};
