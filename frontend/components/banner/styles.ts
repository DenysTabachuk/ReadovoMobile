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
    backgroundColor: '#1caa5f',
  },
  error: {
    backgroundColor: '#c04135',
  },
  reward: {
    backgroundColor: '#d9902f',
    borderColor: '#ffe1a3',
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
  achievementBadge: {
    height: 56,
    width: 56,
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
  achievementTitle: {
    ...Typography.bodyStrong,
  },
  achievementDescription: {
    ...Typography.body,
    color: '#6f7080',
  },
  achievementStatus: {
    color: '#0c8f42',
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
    color: '#0c8f42',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
