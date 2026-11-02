import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  streakBlock: {
    gap: Spacing.md,
  },
  streakAchievementsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  streakRetryButton: {
    backgroundColor: '#ece8f7',
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  streakRetryButtonDark: {
    backgroundColor: '#312447',
  },
  streakRetryButtonText: {
    color: '#3b2b5c',
  },
  streakRetryButtonTextDark: {
    color: '#e1daf5',
  },
  avatarButtonPressed: {
    opacity: 0.72,
  },
});
