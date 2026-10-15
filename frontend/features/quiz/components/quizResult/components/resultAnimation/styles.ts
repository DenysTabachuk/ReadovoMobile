import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  backgroundLayer: {
    alignItems: 'center',
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 48,
    zIndex: 0,
  },
  backgroundVideo: {
    height: '100%',
    width: '100%',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  purpleGlowInner: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderRadius: 110,
    height: 220,
    position: 'absolute',
    width: 220,
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
  videoLoader: {
    alignItems: 'center',
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  videoMask: {
    borderRadius: 150,
    height: 300,
    overflow: 'hidden',
    width: 300,
  },
});
