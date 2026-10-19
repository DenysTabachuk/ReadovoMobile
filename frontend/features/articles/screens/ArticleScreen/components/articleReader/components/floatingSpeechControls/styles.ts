import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  floatingSpeechControls: {
    left: 0,
    paddingHorizontal: Spacing.xLg,
    paddingVertical: Spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
});
