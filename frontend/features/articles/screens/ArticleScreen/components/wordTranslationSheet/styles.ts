import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionButton: {
    alignSelf: 'stretch',
    width: '100%',
  },
  actionButtonText: {
    flexShrink: 1,
    width: '100%',
  },
  actions: {
    gap: Spacing.sm,
    width: '100%',
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
