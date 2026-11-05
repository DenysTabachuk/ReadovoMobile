import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      gap: Spacing.xxLg,
    },
    header: {
      gap: Spacing.sm,
    },
    description: {
      color: colors.textSecondary,
    },
    activities: {
      gap: Spacing.lg,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      minHeight: 144,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    cardPressed: {
      backgroundColor: colors.accentSurface,
      borderColor: colors.accentBorder,
    },
    illustration: {
      width: 88,
      height: 104,
    },
    cardContent: {
      flex: 1,
      gap: Spacing.xs,
    },
    cardDescription: {
      color: colors.textSecondary,
    },
    badge: {
      alignSelf: 'flex-start',
      marginTop: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: colors.accentSurface,
    },
    badgeText: {
      color: colors.onAccentSurface,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600',
    },
  });
