import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  textBlock: {
    gap: Spacing.lg,
    maxWidth: 520,
  },
  errorText: {
    color: '#b42318',
    marginTop: Spacing.xLg,
    maxWidth: 420,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    marginTop: 'auto',
    maxWidth: 420,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: '#fff',
  },
});
