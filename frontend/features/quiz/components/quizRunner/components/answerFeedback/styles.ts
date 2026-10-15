import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

import { QUIZ_ANSWER_COLORS } from '../../constants';

export const styles = StyleSheet.create({
  correctFeedbackBlock: {
    backgroundColor: '#e9f8ee',
    borderColor: '#98d7aa',
  },
  correctFeedbackBlockDark: {
    backgroundColor: '#12291f',
    borderColor: '#2f6f46',
  },
  correctFeedbackText: {
    color: QUIZ_ANSWER_COLORS.correctText,
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
  feedbackText: {
    flex: 1,
    minWidth: 0,
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
    color: QUIZ_ANSWER_COLORS.wrongText,
  },
});
