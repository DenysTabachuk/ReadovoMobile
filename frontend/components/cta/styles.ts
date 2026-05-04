import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actions: {
    gap: Spacing.md,
  },
  actionsWithBackground: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.xLg,
    paddingVertical: Spacing.sm,
  },
  button: {
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonFullWidth: {
    flex: 1,
  },
  label: {
    textAlign: 'center',
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  wrapper: {
    left: Spacing.xLg,
    position: 'absolute',
    right: Spacing.xLg,
    zIndex: 20,
  },
  wrapperFullWidth: {
    left: 0,
    right: 0,
  },
});
