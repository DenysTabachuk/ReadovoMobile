import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

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
    opacity: 0.75,
  },
  ctaRowLight: {
    backgroundColor: '#f1ebff',
    borderColor: '#d8ccf6',
  },
  ctaRowText: {
    fontSize: 14,
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: 14,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    width: 36,
  },
  dayCellDark: {
    borderColor: '#4a4360',
  },
  dayCellLight: {
    borderColor: '#d3c9ef',
  },
  dayCompleted: {
    backgroundColor: '#6a43d8',
  },
  dayFrozen: {
    backgroundColor: '#2d6bc9',
  },
  dayFuture: {
    backgroundColor: 'transparent',
  },
  dayIcon: {
    position: 'absolute',
    right: 3,
    top: 3,
  },
  dayMissed: {
    backgroundColor: '#cc4f5d',
  },
  dayNeutral: {
    backgroundColor: 'transparent',
  },
  dayPressable: {
    borderColor: '#ffffff',
    borderWidth: 1,
  },
  dayPressed: {
    opacity: 0.7,
  },
  dayRestored: {
    backgroundColor: '#ebb35a',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextDark: {
    color: '#ffffff',
  },
  dayTextLight: {
    color: '#1f2340',
  },
  dayTodayPending: {
    backgroundColor: 'transparent',
    borderColor: '#7d4ef6',
    borderWidth: 2,
  },
  emptyDayCell: {
    height: 36,
    width: 36,
  },
  futureDayTextDark: {
    color: '#6f6a86',
  },
  futureDayTextLight: {
    color: '#b3a9d1',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    width: 36,
  },
});
