import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      minHeight: 72,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: 16,
      padding: Spacing.md,
      backgroundColor: colors.surface,
    },
    optionText: { flex: 1, fontSize: 17, lineHeight: 24 },
    marker: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    selectedMarker: { backgroundColor: colors.primary },
    selectedMarkerText: { color: colors.onPrimary },
    selected: {
      borderColor: colors.interactive,
      backgroundColor: colors.selection,
    },
    selectedText: { color: colors.onSelection },
    correct: { borderColor: colors.success },
    incorrect: { borderColor: colors.danger },
  });
