import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  textBlock: {
    gap: Spacing.lg,
    maxWidth: 520,
  },
  form: {
    gap: Spacing.md,
    marginTop: Spacing.xxLg,
    maxWidth: 420,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-start',
  },
  forgotPasswordText: {
    color: '#3357d8',
  },
  signInButton: {
    marginTop: Spacing.sm,
  },
  orText: {
    alignSelf: 'center',
    marginVertical: Spacing.sm,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#dedede',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xLg,
    justifyContent: 'center',
    maxWidth: 420,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: '#33383d',
  },
});
