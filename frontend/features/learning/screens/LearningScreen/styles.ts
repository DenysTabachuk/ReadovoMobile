import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';
import type { ThemeColors } from '@/constants/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: Spacing.lg },
    nestedContent: { paddingTop: Spacing.md },
    header: { gap: Spacing.sm },
    secondary: { color: colors.textSecondary },
    tabs: {
      flexDirection: 'row',
      gap: Spacing.xs,
      backgroundColor: colors.surface,
      padding: Spacing.xs,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      padding: Spacing.xs,
    },
    activeTab: { backgroundColor: colors.selection },
    tabText: { textAlign: 'center' },
    activeTabText: { color: colors.onSelection },
  });
