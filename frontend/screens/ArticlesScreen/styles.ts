import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  listContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxLg,
  },
  header: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.lg,
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
  articleImage: {
    borderRadius: 6,
    height: 88,
    width: 88,
  },
  imagePlaceholder: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  articleContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  articleTitle: {
    flexShrink: 1,
  },
  articleExtract: {
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
});
