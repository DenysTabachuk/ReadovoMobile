import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const styles = StyleSheet.create({
  actionButton: {
    width: '100%',
  },
  actions: {
    bottom: 0,
    gap: Spacing.sm,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
    zIndex: 3,
  },
  backgroundLayer: {
    alignItems: 'center',
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 48,
    zIndex: 0,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundVideo: {
    height: '100%',
    width: '100%',
  },
  videoMask: {
    borderRadius: 150,
    height: 300,
    overflow: 'hidden',
    width: 300,
  },
  videoLoader: {
    alignItems: 'center',
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    zIndex: 2,
  },
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
  purpleGlowInner: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderRadius: 110,
    height: 220,
    position: 'absolute',
    width: 220,
  },
  purpleGlowCore: {
    backgroundColor: 'rgba(192, 132, 252, 0.16)',
    borderRadius: 80,
    height: 160,
    position: 'absolute',
    width: 160,
  },
  purpleGlowFar: {
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    borderRadius: 220,
    height: 440,
    position: 'absolute',
    width: 440,
  },
  purpleGlowMid: {
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
    borderRadius: 155,
    height: 310,
    position: 'absolute',
    width: 310,
  },
  purpleGlowOuter: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 190,
    height: 380,
    position: 'absolute',
    width: 380,
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
  scoreGlowOuter: {
    borderRadius: 184,
    height: 368,
    position: 'absolute',
    width: 368,
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
  scoreGlowNormalInner: {
    backgroundColor: 'rgba(250, 173, 20, 0.24)',
  },
  scoreGlowNormalMid: {
    backgroundColor: 'rgba(250, 173, 20, 0.14)',
  },
  scoreGlowNormalOuter: {
    backgroundColor: 'rgba(250, 173, 20, 0.08)',
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
  title: {
    alignSelf: 'flex-start',
    textAlign: 'left',
    width: '100%',
  },
});
