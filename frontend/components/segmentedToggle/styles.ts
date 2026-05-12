import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    flexDirection: 'row',
    padding: Spacing.xs,
    width: '100%',
  },
  option: {
    borderRadius: 10,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
