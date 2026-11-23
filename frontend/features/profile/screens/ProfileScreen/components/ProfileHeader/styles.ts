import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 92,
    paddingTop: Spacing.lg,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
});
