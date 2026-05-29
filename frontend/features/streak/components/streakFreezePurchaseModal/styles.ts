import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  content: {
    gap: Spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  descriptionDark: {
    color: '#cbc7df',
  },
  descriptionLight: {
    color: '#4a4b57',
  },
  iconCircle: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconCircleDark: {
    backgroundColor: '#1d2b49',
  },
  iconCircleLight: {
    backgroundColor: '#e8f1ff',
  },
  moneyIcon: {
    height: 18,
    width: 18,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2d6bc9',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  secondaryButtonDark: {
    backgroundColor: '#1d1a2e',
    borderColor: '#3a3553',
  },
  secondaryButtonLight: {
    backgroundColor: '#f6f4fb',
    borderColor: '#d8ccf6',
  },
  secondaryTextDark: {
    color: '#e1daf5',
  },
  secondaryTextLight: {
    color: '#3b2b5c',
  },
});
