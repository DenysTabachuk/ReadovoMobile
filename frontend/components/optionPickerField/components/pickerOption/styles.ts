import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    optionButton: {
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    optionButtonSelected: {
      backgroundColor: colors.selection,
      borderColor: colors.selectionBorder,
    },
    optionButtonDisabled: {
      opacity: 0.45,
    },
    optionBadge: {
      backgroundColor: colors.selection,
      borderColor: colors.success,
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    optionBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    optionBadgeText: {
      color: colors.success,
      fontSize: 13,
      lineHeight: 18,
    },
    optionContent: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.sm,
      justifyContent: 'space-between',
      minWidth: 0,
    },
    optionDescription: {
      opacity: 0.75,
    },
    optionLabel: {
      minWidth: 0,
    },
    optionMain: {
      flex: 1,
      gap: Spacing.xs,
      minWidth: 0,
    },
    optionTextDisabled: {
      textDecorationLine: 'line-through',
    },
    statusIconBadge: {
      backgroundColor: colors.selection,
      borderColor: colors.success,
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    statusIcons: {
      flexDirection: 'row',
      flexShrink: 0,
      gap: Spacing.xs,
    },
  });
