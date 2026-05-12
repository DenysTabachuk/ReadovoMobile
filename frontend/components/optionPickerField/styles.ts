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
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  optionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  optionBadgeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  optionDescription: {
    opacity: 0.75,
  },
  optionLabel: {
    minWidth: 0,
  },
  optionMain: {
    flex: 1,
    gap: Spacing.xs,
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
  statusIconBadge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  statusIcons: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: Spacing.xs,
  },
});
