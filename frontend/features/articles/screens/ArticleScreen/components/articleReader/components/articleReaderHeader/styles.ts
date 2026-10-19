import { Spacing } from '@/constants/spacing';
import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  listHeader: {
    gap: Spacing.lg,
  },
  heroImage: {
    borderRadius: 12,
    height: 220,
    width: '100%',
  },
  header: {
    gap: Spacing.sm,
  },
  wikipediaLink: {
    textDecorationLine: 'underline',
  },
});
