import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  scrollContent: {
    gap: Spacing.xLg,
    paddingBottom: Spacing.xxLg,
  },
  header: {
    justifyContent: 'center',
    minHeight: 92,
    paddingTop: Spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  avatar: {
    backgroundColor: '#efe9ff',
    borderRadius: 48,
    height: 96,
    width: 96,
  },
  profileMeta: {
    flex: 1,
    gap: Spacing.xs,
  },
  profileSubtitle: {
    color: '#7d4ef6',
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
    color: '#4a4b57',
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    borderColor: '#e8e8ef',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  statsCardTwoRows: {
    flexWrap: 'wrap',
    rowGap: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  statValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  statItemTwoRows: {
    flexBasis: '50%',
    flexGrow: 0,
    flexShrink: 0,
  },
  statMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  achievementsBlock: {
    gap: Spacing.md,
  },
  achievementCard: {
    alignItems: 'center',
    borderColor: '#ebe8f7',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
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
