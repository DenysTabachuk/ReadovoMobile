import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  progressBadge: {
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  progressFilterBadge: {
    alignSelf: 'flex-start',
  },
  progressText: {
    textAlign: 'center',
  },
});
