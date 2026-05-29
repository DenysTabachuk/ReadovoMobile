import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
    width: 150,
  },
  lockedCardDark: {
    backgroundColor: '#171726',
    borderColor: '#3a3449',
  },
  lockedCardLight: {
    backgroundColor: '#f6f2ff',
    borderColor: '#ddd1f7',
  },
  progressFill: {
    backgroundColor: '#7d4ef6',
    borderRadius: 999,
    height: '100%',
  },
  progressText: {
    fontSize: 12,
  },
  progressTextDark: {
    color: '#b8b4cb',
  },
  progressTextLight: {
    color: '#5b5f76',
  },
  progressTrack: {
    borderRadius: 999,
    height: 7,
    overflow: 'hidden',
    width: '100%',
  },
  progressTrackDark: {
    backgroundColor: '#312d42',
  },
  progressTrackLight: {
    backgroundColor: '#e6dcfb',
  },
  reward: {
    color: '#f2bf4a',
    fontSize: 13,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
  },
  statusDark: {
    color: '#9a95b2',
  },
  statusLight: {
    color: '#6c6f85',
  },
  title: {
    fontSize: 15,
  },
  titleDark: {
    color: '#ffffff',
  },
  titleLight: {
    color: '#1f2340',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  unlockedCardDark: {
    backgroundColor: '#2d1f4b',
    borderColor: '#7d4ef6',
  },
  unlockedCardLight: {
    backgroundColor: '#efe7ff',
    borderColor: '#7d4ef6',
  },
});
