import { StyleSheet } from 'react-native';

import { DAY_CELL_SIZE } from '../../constants';

export const styles = StyleSheet.create({
  dayCell: {
    alignItems: 'center',
    borderRadius: 14,
    height: DAY_CELL_SIZE,
    justifyContent: 'center',
    position: 'relative',
    width: DAY_CELL_SIZE,
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
    height: DAY_CELL_SIZE,
    width: DAY_CELL_SIZE,
  },
  futureDayTextDark: {
    color: '#6f6a86',
  },
  futureDayTextLight: {
    color: '#b3a9d1',
  },
});
