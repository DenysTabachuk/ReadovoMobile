import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: 'space-between',
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
    forgotPasswordButton: {
      alignSelf: 'flex-start',
    },
    forgotPasswordText: {
      color: colors.info,
    },
    signInButton: {
      marginTop: Spacing.sm,
    },
    orText: {
      alignSelf: 'center',
      marginVertical: Spacing.sm,
    },
    googleButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 4,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.xLg,
      justifyContent: 'center',
      maxWidth: 420,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    googleButtonDisabled: {
      opacity: 0.7,
    },
    googleButtonText: {
      color: colors.text,
    },
    createAccountButton: {
      alignSelf: 'center',
      marginTop: Spacing.lg,
    },
    createAccountText: {
      color: colors.info,
      textAlign: 'center',
    },
  });
};
