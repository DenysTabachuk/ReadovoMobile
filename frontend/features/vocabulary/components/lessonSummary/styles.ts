import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    summary: { gap: Spacing.lg },
    heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    image: { width: 72, height: 88 },
    headingText: { flex: 1, gap: Spacing.sm },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    level: {
      backgroundColor: colors.selection,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    levelText: { color: colors.onSelection },
    secondary: { color: colors.textSecondary },
  });
