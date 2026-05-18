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
  octopusImage: {
    alignSelf: 'center',
    height: 240,
    marginTop: Spacing.xLg,
    width: 240,
  },
  continueButton: {
    marginTop: 'auto',
  },
});
