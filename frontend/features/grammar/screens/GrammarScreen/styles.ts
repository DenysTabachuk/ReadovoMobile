import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      gap: Spacing.lg,
    },
    description: {
      color: colors.textSecondary,
    },
    illustration: {
      width: 160,
      height: 160,
      alignSelf: 'center',
    },
  });
