import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
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
    paddingBottom: 104,
    paddingHorizontal: Spacing.xLg,
    paddingTop: Spacing.lg,
  },
  header: {
    gap: Spacing.sm,
  },
  heroImage: {
    borderRadius: 12,
    height: 220,
    width: '100%',
  },
  infoText: {
    opacity: 0.8,
  },
  wikipediaLink: {
    textDecorationLine: 'underline',
  },
});
