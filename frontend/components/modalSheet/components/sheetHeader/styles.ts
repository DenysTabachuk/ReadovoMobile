import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: 36,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
