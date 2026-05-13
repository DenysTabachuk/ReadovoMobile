import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  wrapper: {
    position: 'absolute',
    zIndex: 30,
  },
  wrapperDefault: {
    bottom: Spacing.xLg,
    right: Spacing.xLg,
  },
});
