import { StyleSheet } from 'react-native';

import { palette } from '@/constants/palette';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    shadowColor: palette.black,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  label: {
    textAlign: 'center',
  },
  wrapper: {
    alignItems: 'center',
    left: Spacing.xLg,
    position: 'absolute',
    right: Spacing.xLg,
    zIndex: 20,
  },
});
