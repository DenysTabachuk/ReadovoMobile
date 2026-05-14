import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.md,
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
  ctaButton: {
    alignItems: 'center',
    backgroundColor: '#6f3ff2',
    borderRadius: 12,
    paddingVertical: Spacing.sm,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 14,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCounter: {
    color: '#a7a2be',
    fontSize: 13,
    minWidth: 40,
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
  progressText: {
    fontSize: 13,
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
  status: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: Spacing.md,
    textAlign: 'right',
  },
  statusDark: {
    color: '#ffb067',
  },
  statusLight: {
    color: '#e26a00',
  },
  streakValue: {
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  subtleOnDark: {
    color: '#cbc7df',
  },
  subtleOnLight: {
    color: '#5b5f76',
  },
  textOnDark: {
    color: '#ffffff',
  },
  textOnLight: {
    color: '#1f2340',
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  weekDot: {
    backgroundColor: 'transparent',
    borderRadius: 7,
    borderWidth: 1,
    height: 14,
    width: 14,
  },
  weekDotDark: {
    borderColor: '#5d5675',
  },
  weekDotLight: {
    borderColor: '#b9a8e9',
  },
  weekDotActive: {
    backgroundColor: '#7d4ef6',
    borderColor: '#7d4ef6',
  },
  weekItem: {
    alignItems: 'center',
    gap: 6,
  },
  weekLabel: {
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
