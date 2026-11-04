import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      maxWidth: 420,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
    },
    primaryText: {
      color: colors.onPrimary,
    },
    secondaryText: {
      color: colors.link,
    },
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
      justifyContent: 'center',
      maxWidth: '100%',
      width: '100%',
    },
    leftAccessory: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.82,
    },
    disabled: {
      opacity: 0.6,
    },
  });
