import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerCell: {
      backgroundColor: colors.surfaceMuted,
    },
    chevron: {
      minWidth: 16,
      textAlign: 'center',
    },
    container: {
      gap: Spacing.sm,
    },
    summary: {
      opacity: 0.75,
    },
    table: {
      backgroundColor: colors.background,
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    tableCell: {
      borderColor: colors.borderSubtle,
      borderRightWidth: 1,
      flex: 1,
      minWidth: 0,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    tableCellText: {
      includeFontPadding: false,
      lineHeight: Typography.body.lineHeight,
    },
    tableHeaderText: {
      fontWeight: '700',
    },
    tableRow: {
      borderBottomWidth: 1,
      flexDirection: 'row',
    },
    tableViewport: {
      marginHorizontal: -Spacing.xs,
    },
    tableViewportContent: {
      paddingHorizontal: Spacing.xs,
    },
    tableWideCell: {
      flexGrow: 0,
      flexShrink: 0,
      width: 140,
    },
    toggle: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.sm,
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    toggleCopy: {
      flex: 1,
      gap: Spacing.xs,
    },
  });
