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
  container: {
    gap: Spacing.md,
  },
  setupContent: {
    gap: Spacing.md,
  },
});
