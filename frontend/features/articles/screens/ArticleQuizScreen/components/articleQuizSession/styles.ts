import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.md,
    paddingBottom: 0,
  },
  setupContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  setupBody: {
    gap: Spacing.md,
  },
  setupButton: {
    width: '100%',
  },
  setupFooter: {
    marginTop: 'auto',
  },
});
