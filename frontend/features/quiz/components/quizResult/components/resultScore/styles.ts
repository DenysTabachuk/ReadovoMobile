import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  goodRing: {
    borderColor: '#52c41a',
  },
  messageSubtitle: {
    textAlign: 'center',
  },
  messageTitle: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  normalRing: {
    borderColor: '#faad14',
  },
  poorRing: {
    borderColor: '#ff4d4f',
  },
  scoreCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 122,
    borderWidth: 9,
    gap: Spacing.xs,
    height: 244,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    width: 244,
    zIndex: 2,
  },
  scoreGlowGoodInner: {
    backgroundColor: 'rgba(82, 196, 26, 0.24)',
  },
  scoreGlowGoodMid: {
    backgroundColor: 'rgba(82, 196, 26, 0.14)',
  },
  scoreGlowGoodOuter: {
    backgroundColor: 'rgba(82, 196, 26, 0.08)',
  },
  scoreGlowInner: {
    borderRadius: 136,
    height: 272,
    position: 'absolute',
    width: 272,
  },
  scoreGlowMid: {
    borderRadius: 158,
    height: 316,
    position: 'absolute',
    width: 316,
  },
  scoreGlowNormalInner: {
    backgroundColor: 'rgba(250, 173, 20, 0.24)',
  },
  scoreGlowNormalMid: {
    backgroundColor: 'rgba(250, 173, 20, 0.14)',
  },
  scoreGlowNormalOuter: {
    backgroundColor: 'rgba(250, 173, 20, 0.08)',
  },
  scoreGlowOuter: {
    borderRadius: 184,
    height: 368,
    position: 'absolute',
    width: 368,
  },
  scoreGlowPoorInner: {
    backgroundColor: 'rgba(255, 77, 79, 0.24)',
  },
  scoreGlowPoorMid: {
    backgroundColor: 'rgba(255, 77, 79, 0.14)',
  },
  scoreGlowPoorOuter: {
    backgroundColor: 'rgba(255, 77, 79, 0.08)',
  },
  scoreOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 62,
  },
});
