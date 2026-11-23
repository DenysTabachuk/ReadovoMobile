import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

const SEARCH_ROW_HEIGHT = 48;

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      flex: 1,
      minWidth: 0,
      minHeight: SEARCH_ROW_HEIGHT,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.lg,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 16,
      paddingVertical: Spacing.md,
    },
    clearSearch: { padding: Spacing.xs },
    filters: {
      width: SEARCH_ROW_HEIGHT,
      height: SEARCH_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    filtersPressed: { backgroundColor: colors.selection },
  });
