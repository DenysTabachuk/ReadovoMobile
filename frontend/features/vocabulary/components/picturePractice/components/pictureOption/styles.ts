import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    option: {
      borderWidth: 2,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: Spacing.md,
      gap: Spacing.sm,
      flexBasis: '48%',
    },
    picture: { alignItems: 'center', justifyContent: 'center' },
    image: { width: '100%', height: 96 },
    label: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
  });
