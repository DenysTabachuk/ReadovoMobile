import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors, labelHeight: number) =>
  StyleSheet.create({
    option: {
      borderWidth: 2,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: Spacing.xs,
      gap: Spacing.xs,
      flexBasis: '48%',
    },
    image: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 14,
    },
    labelSlot: {
      height: labelHeight,
      marginHorizontal: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    label: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    word: { flex: 1, includeFontPadding: false },
  });
