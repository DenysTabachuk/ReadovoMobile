import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  container: {
    borderColor: 'rgba(128, 128, 128, 0.24)',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  iconButtonPressed: {
    opacity: 0.76,
  },
  primaryIconButton: {
    backgroundColor: '#0a7ea4',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: 'rgba(128, 128, 128, 0.18)',
    borderRadius: 999,
    height: 4,
    overflow: 'hidden',
  },
  secondaryIconButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  statusText: {
    lineHeight: 26,
    minHeight: 52,
    opacity: 0.72,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.xs,
    minHeight: 80,
    justifyContent: 'center',
    minWidth: 0,
  },
});
