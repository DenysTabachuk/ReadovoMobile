import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  caption: {
    opacity: 0.75,
  },
  container: {
    gap: Spacing.sm,
  },
  fallback: {
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
    minHeight: 220,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xLg,
    width: '100%',
  },
  fallbackText: {
    opacity: 0.8,
    textAlign: 'center',
  },
  fallbackTitle: {
    textAlign: 'center',
  },
  image: {
    borderRadius: 12,
    height: 220,
    width: '100%',
  },
});
