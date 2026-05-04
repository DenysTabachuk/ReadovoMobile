import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  body: {
    gap: Spacing.md,
  },
  content: {
    flex: 1,
    gap: Spacing.md,
  },
  correctOption: {
    borderColor: '#2da44e',
  },
  footer: {
    marginTop: 'auto',
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
