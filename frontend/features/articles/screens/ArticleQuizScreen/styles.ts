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
