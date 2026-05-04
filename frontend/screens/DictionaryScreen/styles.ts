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
  progressText: {
    textAlign: 'center',
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
