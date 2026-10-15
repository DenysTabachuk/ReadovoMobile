import { ResizeMode, Video } from 'expo-av';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { type ResultTier } from '../../types';

import { styles } from './styles';
import { resolveAnimationSource } from './utils/resolveAnimationSource';

type ResultAnimationProps = {
  tier: ResultTier;
};

const READY_VIDEO_OPACITY = 0.94;

export function ResultAnimation({ tier }: ResultAnimationProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const animationSource = resolveAnimationSource(tier, colorScheme);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    setIsVideoReady(false);
  }, [animationSource]);

  return (
    <View pointerEvents="none" style={styles.backgroundLayer}>
      <View style={styles.orbContainer}>
        <View style={styles.purpleGlowFar} />
        <View style={styles.purpleGlowOuter} />
        <View style={styles.purpleGlowMid} />
        <View style={styles.purpleGlowInner} />
        <View style={styles.purpleGlowCore} />
        <View style={styles.videoMask}>
          <Video
            isLooping
            isMuted
            onError={() => setIsVideoReady(true)}
            onLoadStart={() => setIsVideoReady(false)}
            onReadyForDisplay={() => setIsVideoReady(true)}
            shouldPlay
            resizeMode={ResizeMode.CONTAIN}
            source={animationSource}
            style={[
              styles.backgroundVideo,
              {
                backgroundColor: palette.background,
                opacity: isVideoReady ? READY_VIDEO_OPACITY : 0,
              },
            ]}
          />
          {!isVideoReady ? (
            <View
              style={[
                styles.videoLoader,
                { backgroundColor: palette.background },
              ]}
            >
              <ActivityIndicator color={palette.tint} size="large" />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
