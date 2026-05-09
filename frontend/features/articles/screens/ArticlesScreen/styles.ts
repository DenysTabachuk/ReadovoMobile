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
});
