import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    gap: Spacing.xLg,
  },
  header: {
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    minHeight: 120,
    paddingTop: Spacing.lg,
  },
  description: {
    maxWidth: 520,
  },
  section: {
    gap: Spacing.md,
  },
  themeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  themeToggle: {
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    width: 112,
  },
  themeToggleLight: {
    alignItems: 'flex-start',
    backgroundColor: '#f2f4f7',
    borderColor: '#d0d7de',
    borderWidth: 1,
  },
  themeToggleDark: {
    alignItems: 'flex-end',
    backgroundColor: '#2b2d2f',
    borderColor: '#5d6469',
    borderWidth: 1,
  },
  themeThumb: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  themeThumbLight: {
    backgroundColor: '#ffffff',
  },
  themeThumbDark: {
    backgroundColor: '#151718',
  },
});
