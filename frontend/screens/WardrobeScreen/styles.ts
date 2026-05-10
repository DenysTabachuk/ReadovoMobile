import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  balanceIcon: {
    height: 18,
    width: 18,
  },
  clearButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#d0d7de',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  container: {
    paddingBottom: 0,
  },
  footer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxLg,
  },
  header: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  itemAction: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing.sm,
  },
  itemActionDisabled: {
    backgroundColor: '#9ba1a6',
  },
  itemCard: {
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.sm,
    margin: Spacing.xs,
    minHeight: 178,
    padding: Spacing.md,
  },
  itemImage: {
    aspectRatio: 1,
    width: '100%',
  },
  itemMeta: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: Spacing.xxLg,
  },
  previewBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  previewMascot: {
    marginTop: -2 *Spacing.xxLg,
    width: '100%',
  },
  selectedCard: {
    borderColor: '#0a7ea4',
    borderWidth: 2,
  },
  slotRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: -2 * Spacing.xxLg,
  },
  slotTab: {
    alignItems: 'center',
    borderColor: '#d0d7de',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  slotTabActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  slotTabText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  slotTabTextActive: {
    color: '#ffffff',
  },
  title: {
    ...Typography.screenTitle,
  },
  walletIcon: {
    height: 18,
    width: 18,
  },
  walletItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  walletRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  walletText: {
    color: '#6f7080',
    fontSize: 16,
    lineHeight: 22,
  },
});
