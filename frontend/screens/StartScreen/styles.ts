import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
  },
  headerBlock: {
    minHeight: 220,
    justifyContent: 'flex-end',
    marginBottom: 28,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    marginBottom: 12,
  },
  description: {
    fontSize: 18,
    lineHeight: 26,
    maxWidth: 420,
  },
  languageList: {
    gap: 12,
    minHeight: 116,
  },
  languageButton: {
    alignItems: 'center',
    borderColor: '#d0d7de',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    maxWidth: 420,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 24,
  },
});
