import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#f7f3ff',
    borderColor: '#e8e8ef',
    borderRadius: 20,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  text: {
    color: '#5b5f76',
    textAlign: 'center',
  },
  cardDark: {
    backgroundColor: '#20182f',
    borderColor: '#3b2b5c',
  },
  textDark: {
    color: '#cbc7df',
  },
  retryButton: {
    backgroundColor: '#ece8f7',
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  retryButtonDark: {
    backgroundColor: '#312447',
  },
  retryButtonText: {
    color: '#3b2b5c',
  },
  retryButtonTextDark: {
    color: '#e1daf5',
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
