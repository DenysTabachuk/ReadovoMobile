import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  achievementCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    overflow: 'hidden',
    padding: Spacing.md,
    position: 'relative',
  },
  lockedAchievementCard: {
    backgroundColor: 'transparent',
    borderColor: '#ebe8f7',
  },
  unlockedAchievementCard: {
    borderColor: '#9d7cff',
  },
  unlockedAchievementGradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  achievementBadge: {
    height: 56,
    width: 56,
  },
  lockedAchievementBadge: {
    opacity: 0.4,
  },
  achievementMeta: {
    flex: 1,
    gap: Spacing.xs,
  },
  achievementDescription: {
    color: '#6f7080',
    fontSize: 14,
    lineHeight: 20,
  },
  achievementProgressBlock: {
    gap: Spacing.xs,
  },
  achievementProgressFill: {
    borderRadius: 999,
    height: '100%',
  },
  lockedAchievementProgressFill: {
    backgroundColor: '#7d4ef6',
  },
  unlockedAchievementProgressFill: {
    backgroundColor: '#6f3ff2',
  },
  achievementProgressText: {
    color: '#6f7080',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  achievementProgressTrack: {
    backgroundColor: '#ece8f7',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  rewardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  moneyIcon: {
    height: 18,
    width: 18,
  },
  rewardText: {
    color: '#0c8f42',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  unlockedText: {
    color: '#0c8f42',
    fontSize: 13,
    fontWeight: '600',
  },
  lockedText: {
    color: '#8c8ea1',
    fontSize: 13,
    fontWeight: '600',
  },
});
