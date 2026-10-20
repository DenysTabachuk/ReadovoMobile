import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  progressMenu: {
    backgroundColor: '#fff',
    borderColor: '#e8e8ef',
    borderRadius: 8,
    borderWidth: 1,
    gap: Spacing.sm,
    elevation: 6,
    minWidth: 190,
    padding: Spacing.sm,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    top: 36,
    zIndex: 5,
  },
  progressMenuDark: {
    backgroundColor: '#1f2428',
    borderColor: '#2d3336',
  },
  progressMenuHint: {
    color: '#6f7080',
    fontSize: 13,
    lineHeight: 18,
  },
  progressMenuHintDark: {
    color: '#c3c7cf',
  },
  progressMenuBadge: {
    alignSelf: 'flex-start',
  },
});
