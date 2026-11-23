import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

const QUESTION_ART_ASPECT_RATIO = 2.2;

export const styles = StyleSheet.create({
  content: { gap: Spacing.lg },
  artwork: {
    width: '100%',
    aspectRatio: QUESTION_ART_ASPECT_RATIO,
    borderRadius: 16,
  },
  retry: { marginTop: 'auto', paddingTop: Spacing.xLg, gap: Spacing.md },
});
