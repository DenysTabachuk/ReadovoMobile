import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  codeCell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 58,
    minWidth: 42,
  },
  codeCellActive: {
    borderWidth: 2,
  },
  codeCellText: {
    lineHeight: 32,
    textAlign: 'center',
  },
  codeCells: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  codeInputContainer: {
    position: 'relative',
  },
  content: {
    gap: Spacing.md,
  },
  emailHelpBlock: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  emailHelpIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emailHelpDescription: {
    fontSize: 15,
    lineHeight: 21,
  },
  emailHelpTextBlock: {
    flex: 1,
    gap: Spacing.xs,
    minWidth: 0,
  },
  expirationText: {
    textAlign: 'center',
  },
  hiddenInput: {
    height: 1,
    opacity: 0,
    position: 'absolute',
    width: 1,
  },
});
