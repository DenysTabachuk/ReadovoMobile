import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    actionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    buttonPressed: {
      opacity: 0.72,
    },
    content: {
      gap: Spacing.md,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    iconCircle: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: 18,
      height: 48,
      justifyContent: 'center',
      width: 48,
      backgroundColor: colors.infoSurface,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    primaryButtonDisabled: {
      opacity: 0.55,
    },
    primaryText: {
      color: colors.onPrimary,
    },
    secondaryButton: {
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.accentSurface,
      borderColor: colors.accentBorder,
    },
    tokensText: {
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
      color: colors.info,
    },
    secondaryText: {
      color: colors.onAccentSurface,
    },
  });
};
