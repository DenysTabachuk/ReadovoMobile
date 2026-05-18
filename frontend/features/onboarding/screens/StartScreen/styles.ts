import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  headerBlock: {
    justifyContent: 'flex-end',
    marginBottom: Spacing.xxLg,
    minHeight: 190,
  },
  title: {
    marginBottom: Spacing.md,
  },
  description: {
    maxWidth: 420,
  },
  languageSelector: {
    minHeight: 116,
  },
  continueButton: {
    marginTop: 'auto',
  },
});
