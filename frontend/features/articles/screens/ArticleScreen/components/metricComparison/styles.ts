import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  simplificationMetricItem: {
    borderRadius: 10,
    flex: 1,
    gap: Spacing.xs,
    minWidth: 132,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  simplificationMetricLabel: {
    opacity: 0.72,
  },
  simplificationMetricValues: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});
