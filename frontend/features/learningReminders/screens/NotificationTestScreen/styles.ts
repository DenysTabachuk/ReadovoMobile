import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionGroup: {
    gap: Spacing.xs,
  },
  container: {
    paddingHorizontal: 0,
  },
  content: {
    gap: Spacing.md,
  },
  preferenceSummary: {
    gap: Spacing.xs,
  },
  scrollContent: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xLg,
    paddingVertical: Spacing.xLg,
  },
});
