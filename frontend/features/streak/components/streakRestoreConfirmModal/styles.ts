import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  balanceItem: {
    flex: 1,
    gap: Spacing.xs,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  coinRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  content: {
    gap: Spacing.md,
  },
  costRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
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
  errorText: {
    color: '#d64545',
    fontSize: 13,
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
    backgroundColor: '#3b2915',
  },
  iconCircleLight: {
    backgroundColor: '#fff2d8',
  },
  metaDark: {
    color: '#a7a2be',
    fontSize: 13,
  },
  metaLight: {
    color: '#5b5f76',
    fontSize: 13,
  },
  moneyIcon: {
    height: 18,
    width: 18,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#d97706',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
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
    minHeight: 46,
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
