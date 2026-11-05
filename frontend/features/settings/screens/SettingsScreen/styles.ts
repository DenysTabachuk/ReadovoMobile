import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 0,
    },
    scrollContent: {
      gap: Spacing.xLg,
      paddingHorizontal: Spacing.xLg,
    },
    header: {
      gap: Spacing.sm,
      justifyContent: 'flex-end',
      minHeight: 120,
      paddingTop: Spacing.lg,
    },
    description: {
      maxWidth: 520,
    },
    learningReminderRow: {
      alignItems: 'flex-start',
    },
    learningReminderTimeField: {
      maxWidth: 240,
    },
    modalButton: {
      flex: 1,
    },
    modalContent: {
      gap: Spacing.sm,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    section: {
      gap: Spacing.md,
    },
    logoutButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    logoutText: {
      color: colors.danger,
    },
    versionButton: {
      alignItems: 'center',
      marginTop: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    versionText: {
      opacity: 0.75,
    },
  });
};
