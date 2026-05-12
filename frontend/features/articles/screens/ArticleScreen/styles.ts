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
