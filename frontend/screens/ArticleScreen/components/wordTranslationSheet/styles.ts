import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actions: {
    gap: Spacing.sm,
  },
  contextText: {
    opacity: 0.7,
  },
  loadingState: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  translationText: {
    lineHeight: 32,
  },
});
