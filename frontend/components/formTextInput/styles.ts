import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: '400',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    borderColor: '#9f9f9f',
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 18,
    minHeight: 58,
    paddingHorizontal: Spacing.lg,
  },
  inputFocused: {
    borderColor: '#4257ff',
    borderWidth: 2,
  },
  inputWithRightAccessory: {
    paddingRight: 52,
  },
  rightAccessory: {
    position: 'absolute',
    right: Spacing.lg,
    top: 18,
  },
});
