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
  progress: {
    opacity: 0.8,
  },
});
