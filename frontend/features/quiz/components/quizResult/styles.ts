import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionButton: {
    width: '100%',
  },
  actions: {
    bottom: 0,
    gap: Spacing.sm,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
    zIndex: 3,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    zIndex: 2,
  },
  title: {
    alignSelf: 'flex-start',
    textAlign: 'left',
    width: '100%',
  },
});
