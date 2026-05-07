import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.md,
    paddingBottom: Spacing.xxLg,
  },
  loadMoreButton: {
    width: '100%',
  },
  loadMoreFooter: {
    paddingTop: Spacing.sm,
  },
  header: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.lg,
  },
  headerTitleGroup: {
    flex: 1,
    gap: Spacing.xs,
    minWidth: 0,
  },
  headerTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  description: {
    maxWidth: 520,
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
  articleActionsColumn: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    width: 36,
  },
  articleExtract: {
    flexShrink: 1,
    textAlign: 'justify',
  },
  adaptationLine: {
    flexShrink: 1,
  },
  adaptations: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  adaptationsHint: {
    flexShrink: 1,
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
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  centerTitle: {
    textAlign: 'center',
  },
  centerDescription: {
    maxWidth: 420,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xLg,
    paddingVertical: Spacing.xxLg,
  },
  emptyStateButton: {
    marginTop: Spacing.sm,
    minWidth: 160,
  },
  openedIndicator: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
