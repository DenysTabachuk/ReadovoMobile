import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: colors.backdrop,
      flex: 1,
      justifyContent: 'flex-end',
    },
    card: {
      backgroundColor: colors.background,
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
      backgroundColor: colors.handle,
      alignSelf: 'center',
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
