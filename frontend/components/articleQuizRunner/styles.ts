import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

const buttonBlue = '#0a7ea4';

export const styles = StyleSheet.create({
  body: {
    gap: Spacing.md,
  },
  checkboxIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.md,
  },
  correctOption: {
    backgroundColor: '#d7f0df',
    borderColor: '#2da44e',
  },
  correctOptionText: {
    color: '#217a3b',
  },
  footer: {
    gap: Spacing.sm,
    marginTop: 'auto',
  },
  footerButton: {
    width: '100%',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    maxWidth: 420,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  options: {
    gap: Spacing.sm,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  pressedOption: {
    opacity: 0.82,
  },
  feedbackBlock: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  correctFeedbackBlock: {
    backgroundColor: '#e9f8ee',
    borderColor: '#98d7aa',
  },
  correctFeedbackBlockDark: {
    backgroundColor: '#12291f',
    borderColor: '#2f6f46',
  },
  correctFeedbackText: {
    color: '#217a3b',
  },
  feedbackText: {
    flex: 1,
    minWidth: 0,
  },
  progress: {
    opacity: 0.8,
  },
  selectedOption: {
    backgroundColor: buttonBlue,
    borderColor: buttonBlue,
  },
  selectedOptionText: {
    color: '#fff',
  },
  unselectedOption: {
    backgroundColor: 'transparent',
    borderColor: buttonBlue,
  },
  unselectedOptionText: {
    color: buttonBlue,
  },
  wrongOption: {
    backgroundColor: '#f8d7da',
    borderColor: '#cf222e',
  },
  wrongOptionText: {
    color: '#a61b1b',
  },
  wrongFeedbackBlock: {
    backgroundColor: '#fdecec',
    borderColor: '#ef9a9a',
  },
  wrongFeedbackBlockDark: {
    backgroundColor: '#46191f',
    borderColor: '#ff4d4f',
  },
  wrongFeedbackText: {
    color: '#a61b1b',
  },
});
