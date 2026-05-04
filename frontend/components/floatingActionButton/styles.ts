import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    shadowColor: '#000000',
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
