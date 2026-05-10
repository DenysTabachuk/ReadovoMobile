import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: Spacing.xs,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  label: {
    flexShrink: 1,
  },
});
