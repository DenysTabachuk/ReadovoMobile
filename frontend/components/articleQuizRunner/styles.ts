import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
  },
  correctOption: {
    borderColor: '#2da44e',
  },
  options: {
    gap: Spacing.sm,
  },
  progress: {
    opacity: 0.8,
  },
  wrongOption: {
    borderColor: '#cf222e',
  },
});
