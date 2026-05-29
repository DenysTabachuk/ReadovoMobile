import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  overlay: {
    left: 0,
    paddingHorizontal: Spacing.lg,
    position: 'absolute',
    right: 0,
    zIndex: 1000,
  },
  banner: {
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 6,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  success: {
    backgroundColor: '#52c41a',
  },
  error: {
    backgroundColor: '#c04135',
  },
  reward: {
    backgroundColor: '#d9902f',
    borderColor: '#ffe1a3',
  },
  streakLight: {
    backgroundColor: '#d7f0df',
    borderColor: '#98d7aa',
    borderLeftColor: '#52c41a',
  },
  streakDark: {
    backgroundColor: '#1f7a3f',
    borderColor: '#2f8f50',
    borderLeftColor: '#52c41a',
  },
  achievement: {
    backgroundColor: '#f3edff',
    borderColor: '#9d7cff',
    borderLeftColor: '#6f3ff2',
    overflow: 'hidden',
  },
  achievementGradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    position: 'relative',
  },
  rewardIcon: {
    height: 40,
    width: 40,
  },
  streakIcon: {
    marginHorizontal: Spacing.sm,
  },
  achievementBadge: {
    height: 56,
    width: 56,
  },
  achievementIconCircle: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  achievementIconCircleDark: {
    backgroundColor: '#3a2461',
    borderColor: '#7d5fd1',
  },
  achievementIconCircleLight: {
    backgroundColor: '#fff7db',
    borderColor: '#f2bf4a',
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Typography.bodyStrong,
    color: '#fff',
  },
  description: {
    ...Typography.body,
    color: '#fff',
  },
  streakTextLight: {
    color: '#11181c',
  },
  achievementTitle: {
    ...Typography.bodyStrong,
  },
  achievementDescription: {
    ...Typography.body,
    color: '#6f7080',
  },
  achievementStatus: {
    color: '#52c41a',
    fontSize: 13,
    fontWeight: '600',
  },
  achievementRewardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  achievementMoneyIcon: {
    height: 18,
    width: 18,
  },
  achievementRewardText: {
    color: '#52c41a',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
