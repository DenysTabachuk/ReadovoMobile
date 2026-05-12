import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  adaptationBadge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 28,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  adaptationBadgeA: {
    backgroundColor: '#edf9ef',
    borderColor: '#65b96d',
  },
  adaptationBadgeADark: {
    backgroundColor: '#17391e',
    borderColor: '#2f7d3a',
  },
  adaptationBadgeB: {
    backgroundColor: '#f3edff',
    borderColor: '#9b74dc',
  },
  adaptationBadgeBDark: {
    backgroundColor: '#2c174f',
    borderColor: '#7047a8',
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
  adaptationBadgeTextA: {
    color: '#287334',
  },
  adaptationBadgeTextADark: {
    color: '#9bd7a3',
  },
  adaptationBadgeTextB: {
    color: '#6840a8',
  },
  adaptationBadgeTextBDark: {
    color: '#c7a6ff',
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
  adaptationLevelLabelA1: {
    backgroundColor: '#e8f8ea',
    color: '#2c7a37',
  },
  adaptationLevelLabelA1Dark: {
    backgroundColor: '#1b4323',
    color: '#cef2d3',
  },
  adaptationLevelLabelA2: {
    backgroundColor: '#d2efd6',
    color: '#1f682b',
  },
  adaptationLevelLabelA2Dark: {
    backgroundColor: '#24582d',
    color: '#b9e7bf',
  },
  adaptationLevelLabelB1: {
    backgroundColor: '#efe5ff',
    color: '#6840a8',
  },
  adaptationLevelLabelB1Dark: {
    backgroundColor: '#321b5c',
    color: '#eadcff',
  },
  adaptationLevelLabelB2: {
    backgroundColor: '#ddcaff',
    color: '#583092',
  },
  adaptationLevelLabelB2Dark: {
    backgroundColor: '#45247b',
    color: '#d9c2ff',
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
  transformationBadgeAdaptation: {
    backgroundColor: '#e8f8ef',
    borderColor: '#65b96d',
  },
  transformationBadgeAdaptationDark: {
    backgroundColor: '#17391e',
    borderColor: '#2f7d3a',
  },
  transformationBadgeSummary: {
    backgroundColor: '#e8f5f9',
    borderColor: '#5ba7d1',
  },
  transformationBadgeSummaryDark: {
    backgroundColor: '#173444',
    borderColor: '#3c7fa3',
  },
  transformationBadgeTextAdaptation: {
    color: '#287334',
  },
  transformationBadgeTextAdaptationDark: {
    color: '#9bd7a3',
  },
  transformationBadgeTextSummary: {
    color: '#1e6f92',
  },
  transformationBadgeTextSummaryDark: {
    color: '#9bcfe5',
  },
});
