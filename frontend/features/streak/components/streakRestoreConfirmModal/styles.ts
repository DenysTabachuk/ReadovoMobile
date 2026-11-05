import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    actionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    balanceItem: {
      flex: 1,
      gap: Spacing.xs,
    },
    buttonPressed: {
      opacity: 0.72,
    },
    coinRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    content: {
      gap: Spacing.md,
    },
    costRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    iconCircle: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: 18,
      height: 48,
      justifyContent: 'center',
      width: 48,
      backgroundColor: colors.warningSurface,
    },
    moneyIcon: {
      height: 18,
      width: 18,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryText: {
      color: colors.onPrimary,
    },
    secondaryButton: {
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 46,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.accentSurface,
      borderColor: colors.accentBorder,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    secondaryText: {
      color: colors.onAccentSurface,
    },
  });
};
