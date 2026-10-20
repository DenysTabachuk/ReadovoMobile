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
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  testBackButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  testHeaderTitle: {
    flex: 1,
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
  wordModalActions: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmModalButton: {
    flex: 1,
  },
});
