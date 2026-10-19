import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  adaptModalContent: {
    gap: Spacing.lg,
  },
  quizModalLoading: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xLg,
  },
  quizModalActions: {
    gap: Spacing.md,
  },
});
