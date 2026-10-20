import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  cardTapHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  cardTapHintText: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.68,
    textAlign: 'center',
  },
  wordCard: {
    borderRadius: 8,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  wordTitleGroup: {
    flex: 1,
    gap: Spacing.xs,
  },
  wordText: {
    flexShrink: 1,
  },
  wordPreviewText: {
    opacity: 0.78,
  },
  progressBadge: {
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  progressControl: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    position: 'relative',
  },
  progressText: {
    textAlign: 'center',
  },
  learningProgressBlock: {
    gap: Spacing.xs,
  },
  learningProgressTrack: {
    backgroundColor: '#ece8f7',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  learningProgressFill: {
    backgroundColor: '#6f3ff2',
    borderRadius: 999,
    height: '100%',
  },
  learningProgressText: {
    color: '#6f7080',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
