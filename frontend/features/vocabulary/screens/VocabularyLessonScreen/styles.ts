import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.xLg },
    secondary: { color: colors.textSecondary },
    progressPanel: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 20,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    progressHeading: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    stages: { gap: Spacing.md },
    stage: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.md,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    firstStage: {
      borderColor: colors.selectionBorder,
      backgroundColor: colors.selection,
    },
    stageNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    firstStageNumber: { backgroundColor: colors.surface },
    numberText: { color: colors.text },
    stageText: { flex: 1, gap: Spacing.xs },
    upcoming: {
      color: colors.onSelection,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600',
    },
    footer: { gap: Spacing.sm, marginTop: 'auto', paddingTop: Spacing.sm },
    footerHint: { color: colors.textSecondary, textAlign: 'center' },
  });
