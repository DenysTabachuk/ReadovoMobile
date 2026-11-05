import type { ThemeColors } from '@/constants/theme';
import { scoreGlowColors } from './constants';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    goodRing: {
      borderColor: colors.success,
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
      borderColor: colors.warning,
    },
    poorRing: {
      borderColor: colors.danger,
    },
    scoreCircle: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
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
      backgroundColor: scoreGlowColors.good.inner,
    },
    scoreGlowGoodMid: {
      backgroundColor: scoreGlowColors.good.mid,
    },
    scoreGlowGoodOuter: {
      backgroundColor: scoreGlowColors.good.outer,
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
      backgroundColor: scoreGlowColors.normal.inner,
    },
    scoreGlowNormalMid: {
      backgroundColor: scoreGlowColors.normal.mid,
    },
    scoreGlowNormalOuter: {
      backgroundColor: scoreGlowColors.normal.outer,
    },
    scoreGlowOuter: {
      borderRadius: 184,
      height: 368,
      position: 'absolute',
      width: 368,
    },
    scoreGlowPoorInner: {
      backgroundColor: scoreGlowColors.poor.inner,
    },
    scoreGlowPoorMid: {
      backgroundColor: scoreGlowColors.poor.mid,
    },
    scoreGlowPoorOuter: {
      backgroundColor: scoreGlowColors.poor.outer,
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
