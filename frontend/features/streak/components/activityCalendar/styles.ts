import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

import { CALENDAR_GRID_ROWS, DAY_CELL_SIZE } from './constants';

const CALENDAR_GRID_GAP = 8;

export const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  cardDark: {
    backgroundColor: '#151325',
    borderColor: '#423067',
  },
  cardLight: {
    backgroundColor: '#f7f3ff',
    borderColor: '#ddd1f7',
  },
  ctaRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  ctaRowDark: {
    backgroundColor: '#1d1a2e',
    borderColor: '#3a3553',
  },
  ctaRowDisabled: {
    opacity: 0.55,
  },
  ctaRowLight: {
    backgroundColor: '#f1ebff',
    borderColor: '#d8ccf6',
  },
  ctaRowPressed: {
    opacity: 0.78,
  },
  ctaRowRestoreDark: {
    backgroundColor: '#c86c08',
    borderColor: '#f0a64a',
  },
  ctaRowRestoreLight: {
    backgroundColor: '#d97706',
    borderColor: '#b85f00',
  },
  ctaRowRestoreText: {
    color: '#ffffff',
  },
  ctaRowText: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CALENDAR_GRID_GAP,
    minHeight:
      DAY_CELL_SIZE * CALENDAR_GRID_ROWS +
      CALENDAR_GRID_GAP * (CALENDAR_GRID_ROWS - 1),
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: 16,
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  progressCounter: {
    fontSize: 12,
    minWidth: 36,
  },
  progressFill: {
    backgroundColor: '#7d4ef6',
    borderRadius: 999,
    height: '100%',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressTrack: {
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  progressTrackDark: {
    backgroundColor: '#2f2a45',
  },
  progressTrackLight: {
    backgroundColor: '#e6dcfb',
  },
  statusDark: {
    color: '#ffb067',
  },
  statusLight: {
    color: '#e26a00',
  },
  subtitleDark: {
    color: '#a7a2be',
  },
  subtitleLight: {
    color: '#5b5f76',
  },
  summaryStatus: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
  summarySuffix: {
    fontSize: 13,
  },
  summaryTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryValue: {
    fontSize: 24,
    lineHeight: 28,
  },
  summaryValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  titleDark: {
    color: '#ffffff',
  },
  titleLight: {
    color: '#1f2340',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekHeaderText: {
    fontSize: 12,
    textAlign: 'center',
    width: DAY_CELL_SIZE,
  },
});
