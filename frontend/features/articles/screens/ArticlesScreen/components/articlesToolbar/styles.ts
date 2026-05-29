import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
  },
  sheetHeader: {
    marginHorizontal: -Spacing.md,
  },
  sheetHeaderButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  sheetTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sheetContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: Spacing.md,
  },
  filtersContentAnimated: {
    overflow: 'hidden',
  },
  sectionHeaderText: {
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  searchClearButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  searchInputContainer: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  filtersRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryChipLabel: {
    maxWidth: 120,
  },
  categoryList: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categorySection: {
    gap: Spacing.xs,
  },
  pickerField: {
    flex: 1,
    minWidth: 180,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterChipActive: {
    borderWidth: 0,
  },
  infoButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  resultsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  resultsStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  recommendedToggle: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  recommendedToggleLabel: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    minWidth: 0,
  },
  recommendedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  recommendedInfoContent: {
    gap: Spacing.md,
  },
  recommendedInfoButton: {
    marginTop: Spacing.sm,
  },
  recommendedInfoText: {
    lineHeight: 22,
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  clearButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  savedCount: {
    minWidth: 16,
    textAlign: 'right',
  },
});
