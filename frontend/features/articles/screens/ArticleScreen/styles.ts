import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  adaptModalContent: {
    gap: Spacing.lg,
  },
  adaptModalFields: {
    gap: Spacing.md,
  },
  adaptModalPickerField: {
    minWidth: 0,
  },
  pickerField: {
    flex: 1,
    minWidth: 150,
  },
  pickerFieldContent: {
    flex: 1,
  },
  articleContent: {
    paddingBottom: Spacing.xxLg,
  },
  articleMeta: {
    gap: Spacing.xs,
  },
  centerDescription: {
    maxWidth: 420,
    textAlign: 'center',
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  centerTitle: {
    textAlign: 'center',
  },
  container: {
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: 168,
    paddingHorizontal: Spacing.xLg,
    paddingTop: Spacing.lg,
  },
  floatingSpeechControls: {
    left: 0,
    paddingHorizontal: Spacing.xLg,
    paddingVertical: Spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  floatingSpeechControlsInner: {},
  header: {
    gap: Spacing.sm,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginRight: Spacing.sm,
    width: 44,
  },
  heroImage: {
    borderRadius: 12,
    height: 220,
    width: '100%',
  },
  infoText: {
    opacity: 0.8,
  },
  readyStatusItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  readyStatusList: {
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  scrollToCurrentSpeechButton: {
    alignItems: 'center',
    backgroundColor: '#f2c94c',
    borderRadius: 999,
    elevation: 6,
    height: 52,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.md,
    shadowColor: '#000000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    width: 52,
    zIndex: 30,
  },
  simplificationMetricItem: {
    borderRadius: 10,
    flex: 1,
    gap: Spacing.xs,
    minWidth: 132,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  simplificationMetricLabel: {
    opacity: 0.72,
  },
  simplificationMetricValues: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  simplificationMetricsCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  simplificationMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  simplificationMetricsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  listHeader: {
    gap: Spacing.lg,
  },
  quizModalActions: {
    gap: Spacing.md,
  },
  quizModalLoading: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xLg,
  },
  textActionButtons: {
    gap: Spacing.md,
  },
  textModeCaption: {
    opacity: 0.7,
  },
  textModeSection: {
    gap: Spacing.sm,
  },
  translationProgressFill: {
    borderRadius: 999,
    height: '100%',
  },
  translationProgressTrack: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    height: 2,
    overflow: 'hidden',
    width: '100%',
  },
  wikipediaLink: {
    textDecorationLine: 'underline',
  },
});
