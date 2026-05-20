import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  centerDescription: {
    maxWidth: 420,
    textAlign: 'center',
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
  confirmModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmModalButton: {
    flex: 1,
  },
  container: {
    paddingBottom: 0,
  },
});
