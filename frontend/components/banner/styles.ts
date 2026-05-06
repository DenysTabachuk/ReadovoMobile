import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  overlay: {
    left: 0,
    paddingHorizontal: Spacing.lg,
    position: 'absolute',
    right: 0,
    zIndex: 1000,
  },
  banner: {
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 6,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  success: {
    backgroundColor: '#1caa5f',
  },
  error: {
    backgroundColor: '#c04135',
  },
  reward: {
    backgroundColor: '#d9902f',
    borderColor: '#ffe1a3',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rewardIcon: {
    height: 40,
    width: 40,
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Typography.bodyStrong,
    color: '#fff',
  },
  description: {
    ...Typography.body,
    color: '#fff',
  },
});
