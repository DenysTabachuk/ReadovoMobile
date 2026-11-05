import type { ThemeColors } from '@/constants/theme';
import { resultGlowColors } from './constants';
import { StyleSheet } from 'react-native';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backgroundLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 48,
      zIndex: 0,
    },
    backgroundVideo: {
      backgroundColor: colors.background,
      height: '100%',
      width: '100%',
    },
    orbContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    purpleGlowCore: {
      backgroundColor: resultGlowColors.core,
      borderRadius: 80,
      height: 160,
      position: 'absolute',
      width: 160,
    },
    purpleGlowFar: {
      backgroundColor: resultGlowColors.far,
      borderRadius: 220,
      height: 440,
      position: 'absolute',
      width: 440,
    },
    purpleGlowInner: {
      backgroundColor: resultGlowColors.inner,
      borderRadius: 110,
      height: 220,
      position: 'absolute',
      width: 220,
    },
    purpleGlowMid: {
      backgroundColor: resultGlowColors.mid,
      borderRadius: 155,
      height: 310,
      position: 'absolute',
      width: 310,
    },
    purpleGlowOuter: {
      backgroundColor: resultGlowColors.outer,
      borderRadius: 190,
      height: 380,
      position: 'absolute',
      width: 380,
    },
    videoLoader: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoMask: {
      borderRadius: 150,
      height: 300,
      overflow: 'hidden',
      width: 300,
    },
  });
