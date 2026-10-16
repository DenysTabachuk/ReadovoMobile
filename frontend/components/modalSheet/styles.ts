import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: Spacing.lg,
    maxHeight: '85%',
    paddingBottom: Spacing.xLg,
    paddingHorizontal: Spacing.xLg,
    paddingTop: Spacing.md,
  },
  closeArea: {
    flex: 1,
  },
  content: {
    flexShrink: 1,
    gap: Spacing.md,
    minHeight: 0,
  },
  footerContainer: {
    paddingTop: Spacing.xs,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#b5b5b5',
    borderRadius: 999,
    height: 4,
    width: 48,
  },
  scrollView: {
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
});
