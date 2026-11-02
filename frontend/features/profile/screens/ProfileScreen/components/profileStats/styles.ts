import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: '#f7f3ff',
    borderColor: '#e8e8ef',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  statsCardDark: {
    backgroundColor: '#20182f',
    borderColor: '#3b2b5c',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 96,
    gap: Spacing.xs,
  },
  statValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  statMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
});
