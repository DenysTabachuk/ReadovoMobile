import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    width: 44,
  },
  content: {
    flex: 1,
  },
  form: {
    gap: Spacing.md,
    marginTop: Spacing.xxLg,
    maxWidth: 420,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  textBlock: {
    gap: Spacing.lg,
    maxWidth: 520,
  },
});
