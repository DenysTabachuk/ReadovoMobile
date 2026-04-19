import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xLg,
    paddingBottom: Spacing.xxLg,
  },
  content: {
    flex: 1,
  },
  headerBlock: {
    minHeight: 220,
    justifyContent: 'flex-end',
    marginBottom: Spacing.xLg + Spacing.xs,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 18,
    lineHeight: 26,
    maxWidth: 420,
  },
  languageList: {
    gap: Spacing.md,
    minHeight: 116,
  },
  languageButton: {
    alignItems: 'center',
    borderColor: '#d0d7de',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    maxWidth: 420,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  languageButtonSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  flag: {
    fontSize: 28,
    lineHeight: 34,
  },
  languageLabel: {
    fontSize: 18,
    lineHeight: 24,
  },
  languageLabelSelected: {
    color: '#fff',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    marginTop: 'auto',
    maxWidth: 420,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 24,
  },
});
