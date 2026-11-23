import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      minHeight: 280,
      marginHorizontal: -Spacing.xLg,
      marginTop: -Spacing.xLg,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    overlay: {
      paddingHorizontal: Spacing.xLg,
      paddingBottom: Spacing.sm,
      paddingTop: 170,
      gap: Spacing.sm,
    },
    title: { color: colors.text },
    description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  });
