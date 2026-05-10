import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.md,
    paddingBottom: 96,
  },
  header: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.lg,
  },
  description: {
    maxWidth: 520,
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
  translationText: {
    flexShrink: 1,
  },
  contextText: {
    opacity: 0.74,
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
  progressMenu: {
    backgroundColor: '#fff',
    borderColor: '#e8e8ef',
    borderRadius: 8,
    borderWidth: 1,
    gap: Spacing.sm,
    elevation: 6,
    minWidth: 190,
    padding: Spacing.sm,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    top: 36,
    zIndex: 5,
  },
  progressMenuDark: {
    backgroundColor: '#1f2428',
    borderColor: '#2d3336',
  },
  progressMenuHint: {
    color: '#6f7080',
    fontSize: 13,
    lineHeight: 18,
  },
  progressMenuHintDark: {
    color: '#c3c7cf',
  },
  progressMenuBadge: {
    alignSelf: 'flex-start',
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  centerTitle: {
    textAlign: 'center',
  },
  centerDescription: {
    maxWidth: 420,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xLg,
    paddingVertical: Spacing.xxLg,
  },
  testHintCard: {
    borderWidth: 1,
    borderRadius: 8,
    gap: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
  },
  testHintHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  testHintDescription: {
    lineHeight: 20,
  },
  testHintTitle: {
    flex: 1,
    lineHeight: 22,
  },
  testContainer: {
    flex: 1,
    gap: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  testHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  questionWord: {
    textAlign: 'center',
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionButton: {
    maxWidth: '100%',
  },
  optionText: {
    flexShrink: 1,
  },
  correctOption: {
    backgroundColor: '#1f8a4c',
    borderColor: '#1f8a4c',
  },
  wrongOption: {
    backgroundColor: '#c2410c',
    borderColor: '#c2410c',
  },
  answeredOptionText: {
    color: '#fff',
  },
  answerResult: {
    gap: Spacing.md,
  },
  testError: {
    color: '#c2410c',
  },
});
