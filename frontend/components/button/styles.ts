import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

const buttonBlue = '#0a7ea4';

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 420,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  primary: {
    backgroundColor: buttonBlue,
    borderColor: buttonBlue,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: buttonBlue,
  },
  text: {
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: buttonBlue,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.6,
  },
});
