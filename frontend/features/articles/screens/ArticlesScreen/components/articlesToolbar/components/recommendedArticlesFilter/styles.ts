import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  infoButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
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
});
