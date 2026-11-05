import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    statsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: Spacing.md,
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.lg,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
      minWidth: 96,
      gap: Spacing.xs,
    },
    statValueRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
    },
    statMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
    },
    statValue: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 34,
    },
    statLabel: {
      fontSize: 13,
      lineHeight: 18,
    },
  });
};
