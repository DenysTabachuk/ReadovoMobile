import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    actionText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
      textAlign: 'center',
    },
    balanceIcon: {
      height: 18,
      width: 18,
    },
    clearButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
    },
    container: {
      paddingBottom: 0,
    },
    footer: {
      paddingBottom: Spacing.xxLg,
      paddingTop: Spacing.lg,
    },
    footerActions: {
      gap: Spacing.sm,
    },
    footerButton: {
      width: '100%',
    },
    header: {
      gap: Spacing.md,
      paddingBottom: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    itemAction: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: Spacing.sm,
    },
    itemActionDisabled: {
      backgroundColor: colors.borderStrong,
    },
    itemCard: {
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      gap: Spacing.sm,
      margin: Spacing.xs,
      minHeight: 178,
      padding: Spacing.md,
    },
    itemImage: {
      aspectRatio: 1,
      width: '100%',
    },
    itemMeta: {
      flex: 1,
      gap: Spacing.xs,
      justifyContent: 'space-between',
    },
    itemPriceRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
    },
    listContent: {
      paddingBottom: Spacing.xxLg,
    },
    ownedLabel: {
      color: colors.success,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
    },
    previewBlock: {
      alignItems: 'center',
      gap: Spacing.md,
    },
    previewMascot: {
      marginTop: -2 * Spacing.xxLg,
      width: '100%',
    },
    purchaseModalActions: {
      gap: Spacing.sm,
    },
    purchaseModalButton: {
      width: '100%',
    },
    purchaseModalContent: {
      gap: Spacing.md,
    },
    purchaseModalDescription: {
      fontSize: 15,
      lineHeight: 22,
    },
    purchaseModalError: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
    },
    purchaseModalImage: {
      alignSelf: 'center',
      height: 112,
      width: 112,
    },
    purchaseModalPriceRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    selectedCard: {
      borderColor: colors.selectionBorder,
      borderWidth: 2,
    },
    slotRow: {
      flexDirection: 'row',
      marginTop: -2 * Spacing.xxLg,
    },
    slotTab: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      minHeight: 38,
      marginRight: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    slotTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    slotTabText: {
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
    },
    slotTabTextActive: {
      color: colors.onPrimary,
    },
    title: {
      ...Typography.screenTitle,
    },
    walletIcon: {
      height: 18,
      width: 18,
    },
    walletItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    walletRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    walletText: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 22,
    },
  });
};
