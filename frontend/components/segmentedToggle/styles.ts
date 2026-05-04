import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    padding: Spacing.xs,
  },
  option: {
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
