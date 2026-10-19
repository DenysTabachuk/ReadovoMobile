import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  adaptModalContent: {
    gap: Spacing.lg,
  },
  adaptModalFields: {
    gap: Spacing.md,
  },
  adaptModalPickerField: {
    minWidth: 0,
  },
  textModeSection: {
    gap: Spacing.sm,
  },
  textModeCaption: {
    opacity: 0.7,
  },
  readyStatusList: {
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  readyStatusItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  textActionButtons: {
    gap: Spacing.md,
  },
});
