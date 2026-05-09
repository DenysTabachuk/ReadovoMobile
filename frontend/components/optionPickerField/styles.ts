import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  field: {
    gap: Spacing.xs,
    minWidth: 140,
  },
  optionButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  optionButtonDisabled: {
    opacity: 0.45,
  },
  optionBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  optionBadgeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
  },
  optionTextDisabled: {
    textDecorationLine: 'line-through',
  },
  optionsList: {
    gap: Spacing.sm,
  },
  pickerButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  pickerLabel: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
});
