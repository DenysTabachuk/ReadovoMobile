import { useMemo, useEffect, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { ResizeMode, Video } from 'expo-av';
import { ActivityIndicator, View } from 'react-native';

import { type ResultTier } from '../../types';

import { createStyles } from './styles';
import { resolveAnimationSource } from './utils/resolveAnimationSource';

type ResultAnimationProps = {
  tier: ResultTier;
};

const READY_VIDEO_OPACITY = 0.94;

export function ResultAnimation({ tier }: ResultAnimationProps) {
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const animationSource = resolveAnimationSource(tier, theme);
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
              { opacity: isVideoReady ? READY_VIDEO_OPACITY : 0 },
            ]}
          />
          {!isVideoReady ? (
            <View style={styles.videoLoader}>
              <ActivityIndicator color={colors.interactive} size="large" />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
