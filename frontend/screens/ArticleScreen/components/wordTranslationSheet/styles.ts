import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actions: {
    gap: Spacing.sm,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  closeArea: {
    flex: 1,
  },
  content: {
    gap: Spacing.md,
  },
  contextText: {
    opacity: 0.7,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#b5b5b5',
    borderRadius: 999,
    height: 4,
    width: 48,
  },
  loadingState: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxLg,
    paddingHorizontal: Spacing.xLg,
    paddingTop: Spacing.md,
  },
  translationText: {
    lineHeight: 32,
  },
});
