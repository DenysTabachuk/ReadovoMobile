import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  simplificationMetricsCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  simplificationMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  simplificationMetricsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});
