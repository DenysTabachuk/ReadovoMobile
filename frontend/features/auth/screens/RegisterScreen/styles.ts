import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    textBlock: {
      gap: Spacing.lg,
      maxWidth: 520,
    },
    form: {
      gap: Spacing.md,
      marginTop: Spacing.xxLg,
      maxWidth: 420,
    },
    registerButton: {
      marginTop: Spacing.sm,
    },
    signInLink: {
      alignSelf: 'center',
      marginTop: Spacing.sm,
    },
    signInText: {
      color: colors.info,
      textAlign: 'center',
    },
  });
