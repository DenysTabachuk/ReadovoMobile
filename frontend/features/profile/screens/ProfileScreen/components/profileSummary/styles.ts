import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    profileCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    avatar: {
      backgroundColor: colors.surface,
      borderRadius: 48,
      height: 96,
      width: 96,
    },
    avatarButton: {
      borderRadius: 48,
    },
    avatarButtonPressed: {
      opacity: 0.72,
    },
    mascotHint: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    profileMeta: {
      flex: 1,
      gap: Spacing.xs,
    },
    profileSubtitle: {
      color: colors.textSecondary,
    },
    walletRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginTop: Spacing.xs,
    },
    walletItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    walletIcon: {
      height: 16,
      width: 16,
    },
    walletText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
  });
