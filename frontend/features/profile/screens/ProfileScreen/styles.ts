import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  scrollContent: {
    gap: Spacing.xLg,
    paddingBottom: Spacing.xxLg,
  },
  header: {
    justifyContent: 'center',
    minHeight: 92,
    paddingTop: Spacing.lg,
  },
  streakSection: {
    gap: Spacing.md,
  },
});
