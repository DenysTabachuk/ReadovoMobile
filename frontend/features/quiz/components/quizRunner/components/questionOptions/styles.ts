import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/theme';

import { QUIZ_ANSWER_COLORS } from '../../constants';

export const styles = StyleSheet.create({
  checkboxIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctOption: {
    backgroundColor: '#d7f0df',
    borderColor: QUIZ_ANSWER_COLORS.correct,
  },
  correctOptionText: {
    color: QUIZ_ANSWER_COLORS.correctText,
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
  selectedOption: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  selectedOptionText: {
    color: Colors.dark.tint,
  },
  unselectedOption: {
    backgroundColor: 'transparent',
    borderColor: Colors.light.tint,
  },
  unselectedOptionText: {
    color: Colors.light.tint,
  },
  wrongOption: {
    backgroundColor: '#f8d7da',
    borderColor: QUIZ_ANSWER_COLORS.wrong,
  },
  wrongOptionText: {
    color: QUIZ_ANSWER_COLORS.wrongText,
  },
});
