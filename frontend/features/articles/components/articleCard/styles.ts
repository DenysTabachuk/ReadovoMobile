import type { ThemeColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    adaptationBadge: {
      alignItems: 'center',
      borderRadius: 999,
      borderWidth: 1,
      minHeight: 28,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    adaptationBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    adaptationBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 16,
    },
    adaptationLevelLabel: {
      borderRadius: 8,
      flexShrink: 0,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
      minWidth: 36,
      overflow: 'hidden',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      textAlign: 'center',
    },
    adaptationLevelRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    adaptations: {
      gap: Spacing.xs,
      paddingTop: Spacing.xs,
    },
    adaptationsPanel: {
      gap: Spacing.xs,
    },
    adaptationsToggle: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    adaptationsToggleText: {
      flexShrink: 1,
    },
    articleActionsColumn: {
      alignItems: 'center',
      alignSelf: 'stretch',
      justifyContent: 'space-between',
      width: 36,
    },
    articleCard: {
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: Spacing.md,
      padding: Spacing.md,
    },
    articleCardPressed: {
      opacity: 0.78,
    },
    articleContent: {
      flex: 1,
      gap: Spacing.xs,
      minWidth: 0,
    },
    articleExtract: {
      flexShrink: 1,
      textAlign: 'justify',
    },
    articleTitle: {
      flex: 1,
      flexShrink: 1,
    },
    articleTitleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    cardBookmarkButton: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    openedIndicator: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    adaptationBadgeA: {
      backgroundColor: colors.successSurface,
      borderColor: colors.successBorder,
    },
    adaptationBadgeB: {
      backgroundColor: colors.accentSurface,
      borderColor: colors.accentBorder,
    },
    adaptationBadgeTextA: {
      color: colors.success,
    },
    adaptationBadgeTextB: {
      color: colors.onAccentSurface,
    },
    adaptationLevelLabelA1: {
      backgroundColor: colors.successSurface,
      color: colors.success,
    },
    adaptationLevelLabelA2: {
      backgroundColor: colors.successSurface,
      color: colors.success,
    },
    adaptationLevelLabelB1: {
      backgroundColor: colors.accentSurface,
      color: colors.onAccentSurface,
    },
    adaptationLevelLabelB2: {
      backgroundColor: colors.accentSurface,
      color: colors.onAccentSurface,
    },
    transformationBadgeAdaptation: {
      backgroundColor: colors.successSurface,
      borderColor: colors.successBorder,
    },
    transformationBadgeSummary: {
      backgroundColor: colors.infoSurface,
      borderColor: colors.infoBorder,
    },
    transformationBadgeTextAdaptation: {
      color: colors.success,
    },
    transformationBadgeTextSummary: {
      color: colors.info,
    },
  });
};
