import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
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
});
