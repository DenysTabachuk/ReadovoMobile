import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },
    label: {
      fontWeight: '400',
    },
    inputWrap: {
      position: 'relative',
    },
    input: {
      color: colors.text,
      borderColor: colors.inputBorder,
      borderRadius: 18,
      borderWidth: 1,
      fontSize: 18,
      minHeight: 58,
      paddingHorizontal: Spacing.lg,
    },
    inputFocused: {
      borderColor: colors.focus,
      borderWidth: 2,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
    },
    inputWithRightAccessory: {
      paddingRight: 52,
    },
    rightAccessory: {
      position: 'absolute',
      right: Spacing.lg,
      top: 18,
    },
  });
