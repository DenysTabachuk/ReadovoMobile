import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  fallbackText: {
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    minWidth: '100%',
  },
});
