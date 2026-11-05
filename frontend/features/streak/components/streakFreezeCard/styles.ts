import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    buyButton: {
      alignItems: 'center',
      borderRadius: 12,
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.infoSolid,
    },
    buyButtonDisabled: {
      opacity: 0.55,
    },
    buyButtonPressed: {
      opacity: 0.72,
    },
    buyButtonText: {
      color: colors.onInfoSolid,
      fontSize: 13,
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      gap: Spacing.sm,
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
    },
    description: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    footerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.md,
      justifyContent: 'space-between',
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    moneyIcon: {
      height: 18,
      width: 18,
    },
    priceRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    priceText: {
      fontSize: 14,
      fontWeight: '700',
    },
    titleRow: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    tokenValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    warningText: {
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    title: {
      color: colors.text,
    },
  });
};
