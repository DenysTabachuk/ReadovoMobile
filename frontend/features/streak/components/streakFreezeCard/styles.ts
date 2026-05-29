import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  buyButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buyButtonDark: {
    backgroundColor: '#2d6bc9',
  },
  buyButtonDisabled: {
    opacity: 0.55,
  },
  buyButtonLight: {
    backgroundColor: '#2d6bc9',
  },
  buyButtonPressed: {
    opacity: 0.72,
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 13,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  cardDark: {
    backgroundColor: '#151325',
    borderColor: '#423067',
  },
  cardLight: {
    backgroundColor: '#f7fbff',
    borderColor: '#cfe1ff',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionDark: {
    color: '#a7a2be',
  },
  descriptionLight: {
    color: '#5b5f76',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  titleDark: {
    color: '#ffffff',
  },
  titleLight: {
    color: '#1f2340',
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tokenValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  tokenValueDark: {
    color: '#8db7ff',
  },
  tokenValueLight: {
    color: '#245aa8',
  },
  warningText: {
    color: '#cc4f5d',
    fontSize: 13,
    lineHeight: 18,
  },
});
