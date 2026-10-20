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
  avatarButton: {
    borderRadius: 48,
  },
  avatarButtonPressed: {
    opacity: 0.72,
  },
  mascotHint: {
    color: '#8c8ea1',
    fontSize: 13,
    lineHeight: 18,
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
    backgroundColor: '#f7f3ff',
    borderColor: '#e8e8ef',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  statsCardDark: {
    backgroundColor: '#20182f',
    borderColor: '#3b2b5c',
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
  streakAchievementsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  streakBlock: {
    gap: Spacing.md,
  },
  streakNoticeCard: {
    alignItems: 'center',
    backgroundColor: '#f7f3ff',
    borderColor: '#e8e8ef',
    borderRadius: 20,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  streakNoticeText: {
    color: '#5b5f76',
    textAlign: 'center',
  },
  streakNoticeCardDark: {
    backgroundColor: '#20182f',
    borderColor: '#3b2b5c',
  },
  streakNoticeTextDark: {
    color: '#cbc7df',
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
});
