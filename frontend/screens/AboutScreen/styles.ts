import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xLg,
  },
  content: {
    gap: Spacing.lg,
    maxWidth: 520,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
  },
});
