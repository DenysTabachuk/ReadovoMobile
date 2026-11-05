import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    cardLabel: {
      marginBottom: Spacing.xs,
      opacity: 0.65,
    },
    cardText: {
      lineHeight: 32,
    },
    contextCard: {
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      borderWidth: 1,
      padding: Spacing.md,
    },
    contextHint: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
    },
    contextHintText: {
      fontSize: 12,
      lineHeight: 16,
      opacity: 0.7,
      textAlign: 'center',
    },
    contextSection: {
      gap: Spacing.xs,
    },
    translationCard: {
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      borderWidth: 1,
      padding: Spacing.md,
    },
    wordHint: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'center',
      marginTop: -Spacing.xs,
    },
  });
