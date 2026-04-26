import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  articleContent: {
    paddingBottom: Spacing.xxLg,
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
    paddingBottom: Spacing.xxLg,
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
  wikipediaLink: {
    textDecorationLine: 'underline',
  },
});
