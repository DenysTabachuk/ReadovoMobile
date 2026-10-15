import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/theme';

export const styles = StyleSheet.create({
  languageButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    maxWidth: 420,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  languageButtonSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  languageLabel: {
    flexShrink: 1,
  },
  selectedLanguageText: {
    color: Colors.dark.tint,
  },
});
